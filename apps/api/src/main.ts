// Charge apps/api/.env (DATABASE_URL, JWT_SECRET, ...) — `nest start`
// ne lit pas les fichiers .env tout seul, sans ça l'API ne voit que
// les variables exportées dans le shell.
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync } from 'fs';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  // rawBody: true expose le corps brut des requêtes (req.rawBody),
  // indispensable pour vérifier la signature HMAC des webhooks de paiement.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Les affiches sont des ressources publiques chargées en cross-origin
  // par le frontend (<img>) : same-origin les bloquerait.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000').split(','),
    credentials: true
  });

  // Affiches uploadées (POST /admin/events/:id/banner), servies sous /uploads/
  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Documentation interactive : utile en dev, exposée = surface
  // d'attaque en production (énumération des routes). Désactivée en prod.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Tikè Ayiti API')
      .setDescription('MVP billetterie haïtienne : événements, commandes, MonCash/NatCash, billets QR.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.API_PORT || 3001);
}
bootstrap();

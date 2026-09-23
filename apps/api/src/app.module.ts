import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaService } from './prisma.service';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.RATE_LIMIT_TTL_SECONDS || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
      }
    ]),
    // Enregistré en global : tous les modules (dont AuthModule) partagent
    // la même configuration JWT. Avant ce correctif, AuthModule importait un
    // JwtModule vide et jwt.sign() échouait à l'exécution.
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    OrdersModule,
    PaymentsModule,
    TicketsModule,
    AdminModule
  ],
  providers: [
    PrismaService,
    // Rate limiting appliqué à toutes les routes par défaut.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Format d'erreur JSON stable + logs, sur toutes les routes.
    { provide: APP_FILTER, useClass: HttpExceptionFilter }
  ],
  exports: [PrismaService]
})
export class AppModule {}

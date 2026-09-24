import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const cities = ['Port-au-Prince', 'Cap-Haïtien', 'Jacmel', 'Les Cayes', 'Gonaïves'];
  const categories = ['Concert', 'Festival', 'Culture', 'Sport', 'Conférence'];

  for (const name of cities) {
    await prisma.city.upsert({ where: { name }, update: {}, create: { name } });
  }
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@tikeayiti.ht';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      firstName: 'Admin',
      lastName: 'Tikè Ayiti',
      email: adminEmail,
      passwordHash,
      role: 'ADMIN'
    }
  });

  const pap = await prisma.city.findUniqueOrThrow({ where: { name: 'Port-au-Prince' } });
  const cap = await prisma.city.findUniqueOrThrow({ where: { name: 'Cap-Haïtien' } });
  const concert = await prisma.category.findUniqueOrThrow({ where: { name: 'Concert' } });
  const festival = await prisma.category.findUniqueOrThrow({ where: { name: 'Festival' } });

  const events = [
    {
      title: 'Konpa Night Live',
      slug: 'konpa-night-live',
      description: 'Une nuit de konpa avec les meilleurs groupes du moment.',
      cityId: pap.id,
      categoryId: concert.id,
      address: 'Parc Historique de la Canne à Sucre',
      artistName: 'T-Vice & Carimi Revival',
      eventDate: new Date('2026-12-19T20:00:00-05:00'),
      doorsOpen: new Date('2026-12-19T18:00:00-05:00'),
      price: 1500,
      capacity: 2000
    },
    {
      title: 'Festival Mizik Lakay',
      slug: 'festival-mizik-lakay',
      description: 'Deux jours de musique, artisanat et gastronomie haïtienne.',
      cityId: cap.id,
      categoryId: festival.id,
      address: 'Boulevard du Cap-Haïtien',
      artistName: 'Artistes variés',
      eventDate: new Date('2027-01-16T10:00:00-05:00'),
      doorsOpen: new Date('2027-01-16T08:00:00-05:00'),
      price: 750,
      capacity: 5000
    }
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: { ...e, ticketsAvailable: e.capacity, status: 'PUBLISHED' }
    });
  }

  console.log('Seed OK : villes, catégories, admin et 2 événements créés.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

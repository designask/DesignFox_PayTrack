const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@serviceflow.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@serviceflow.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@serviceflow.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@serviceflow.com',
      password: hashedPassword,
      role: 'STAFF',
    },
  });

  await prisma.user.upsert({
    where: { email: 'accountant@serviceflow.com' },
    update: {},
    create: {
      name: 'Accountant User',
      email: 'accountant@serviceflow.com',
      password: hashedPassword,
      role: 'ACCOUNTANT',
    },
  });

  console.log('Seed data created successfully!');
  console.log('Default login: admin@serviceflow.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import 'dotenv/config';
import prisma from './lib/db.js';
import bcrypt from 'bcryptjs';

// All departments from the category → department mapping
const DEPARTMENTS = [
  'Registrar',
  'Dean of Academics',
  'Dean of Student Affairs',
  'Senior Doctor',
  'Chief Warden',
];

// Seed users for testing
const SEED_USERS = [
  { email: 'student@university.edu', password: 'password', role: 'STUDENT' },
  { email: 'admin@university.edu', password: 'password', role: 'ADMIN', departmentName: 'Registrar' },
  { email: 'authority@university.edu', password: 'password', role: 'AUTHORITY' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create departments
  for (const name of DEPARTMENTS) {
    const existing = await prisma.department.findUnique({ where: { name } });
    if (!existing) {
      await prisma.department.create({ data: { name } });
      console.log(`  ✅ Department: ${name}`);
    } else {
      console.log(`  ⏭  Department exists: ${name}`);
    }
  }

  console.log('');

  // Create users
  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  ⏭  User exists: ${u.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    let deptId = null;
    if (u.departmentName) {
      const dept = await prisma.department.findUnique({ where: { name: u.departmentName } });
      deptId = dept?.id || null;
    }

    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        role: u.role,
        departmentId: deptId
      }
    });
    console.log(`  ✅ User: ${u.email} (${u.role})`);
  }

  console.log('\n✨ Seed complete!\n');
  console.log('Test credentials:');
  console.log('  Student:   student@university.edu / password');
  console.log('  Admin:     admin@university.edu / password');
  console.log('  Authority: authority@university.edu / password');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

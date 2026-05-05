import 'dotenv/config';
import prisma from './lib/db.js';
import bcrypt from 'bcryptjs';

// All departments from the hierarchy system
const DEPARTMENTS = [
  'Registrar',
  'Dean of Academics',
  'Dean of Student Affairs',
  'Senior Doctor',
  'Chief Warden',
];

// Seed users for testing — now with hierarchy designations
const SEED_USERS = [
  // Students
  { email: 'student@university.edu', password: 'password', role: 'STUDENT' },
  { email: 'student2@university.edu', password: 'password', role: 'STUDENT' },

  // Hostel & Housekeeping Chain: Caretaker → Warden → Chief Warden → VC
  { email: 'caretaker@university.edu', password: 'password', role: 'ADMIN', designation: 'Caretaker', departmentName: 'Chief Warden' },
  { email: 'warden@university.edu', password: 'password', role: 'ADMIN', designation: 'Warden', departmentName: 'Chief Warden' },
  { email: 'chiefwarden@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Chief Warden', departmentName: 'Chief Warden' },

  // Mess & Canteen Chain: Mess Incharge → Registrar → VC
  { email: 'messincharge@university.edu', password: 'password', role: 'ADMIN', designation: 'Mess Incharge', departmentName: 'Registrar' },
  { email: 'registrar@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Registrar', departmentName: 'Registrar' },

  // Personal Chain: Student Counselor → Dean of Student Affairs → VC
  { email: 'counselor@university.edu', password: 'password', role: 'ADMIN', designation: 'Student Counselor', departmentName: 'Dean of Student Affairs' },
  { email: 'deansa@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Dean of Student Affairs', departmentName: 'Dean of Student Affairs' },

  // Medical Chain: Medical Officer → Chief Medical Officer → VC
  { email: 'medicalofficer@university.edu', password: 'password', role: 'ADMIN', designation: 'Medical Officer', departmentName: 'Senior Doctor' },
  { email: 'cmo@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Chief Medical Officer', departmentName: 'Senior Doctor' },

  // Academics Chain: Dean of Academics → Registrar → VC
  { email: 'deanacad@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Dean of Academics', departmentName: 'Dean of Academics' },

  // Top of all chains
  { email: 'vc@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Vice Chancellor' },

  // Legacy admin (kept for backward compat)
  { email: 'admin@university.edu', password: 'password', role: 'ADMIN', designation: 'Caretaker', departmentName: 'Registrar' },
  { email: 'authority@university.edu', password: 'password', role: 'AUTHORITY', designation: 'Registrar' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Clean slate: Remove all existing tickets and related data ──
  console.log('  🗑  Wiping existing tickets for clean hierarchy migration...');
  await prisma.escalationLog.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaint.deleteMany({});
  console.log('  ✅ Old tickets removed.\n');

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
      // Update designation if it changed
      if (u.designation && existing.designation !== u.designation) {
        await prisma.user.update({
          where: { email: u.email },
          data: { designation: u.designation }
        });
        console.log(`  🔄 Updated designation for ${u.email}: ${u.designation}`);
      } else {
        console.log(`  ⏭  User exists: ${u.email}`);
      }
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
        designation: u.designation || null,
        departmentId: deptId
      }
    });
    console.log(`  ✅ User: ${u.email} (${u.role}${u.designation ? ` / ${u.designation}` : ''})`);
  }

  console.log('\n✨ Seed complete!\n');
  console.log('Hierarchy Test Credentials:');
  console.log('  Student:         student@university.edu / password');
  console.log('  Caretaker:       caretaker@university.edu / password');
  console.log('  Warden:          warden@university.edu / password');
  console.log('  Chief Warden:    chiefwarden@university.edu / password');
  console.log('  Mess Incharge:   messincharge@university.edu / password');
  console.log('  Registrar:       registrar@university.edu / password');
  console.log('  Counselor:       counselor@university.edu / password');
  console.log('  Dean SA:         deansa@university.edu / password');
  console.log('  Medical Officer: medicalofficer@university.edu / password');
  console.log('  CMO:             cmo@university.edu / password');
  console.log('  Dean Academics:  deanacad@university.edu / password');
  console.log('  Vice Chancellor: vc@university.edu / password');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

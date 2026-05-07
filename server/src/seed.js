import 'dotenv/config';
import prisma from './lib/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// All departments from the hierarchy system
const DEPARTMENTS = [
  'Registrar',
  'Dean of Academics',
  'Dean of Student Affairs',
  'Senior Doctor',
  'Chief Warden',
];

// Seed users for testing — strictly following the 3-level hierarchy
const SEED_USERS = [
  // Students
  { email: 'student@university.edu', password: 'password', role: 'STUDENT', name: 'Saransh Sharma', rollNo: '2194/21' },
  { email: 'student2@university.edu', password: 'password', role: 'STUDENT', name: 'Rahul Kumar', rollNo: '2195/21' },

  // Level 0 (Dept Heads / Ground Staff)
  { email: 'caretaker@university.edu', password: 'password', role: 'ADMIN', designation: 'Caretaker', name: 'Mr. Rajesh (Caretaker)', departmentName: 'Chief Warden', authorityId: 'AUTH-101' },
  { email: 'warden@university.edu', password: 'password', role: 'ADMIN', designation: 'Warden', name: 'Dr. Amit Singh (Warden)', departmentName: 'Chief Warden', authorityId: 'AUTH-102' },
  { email: 'messincharge@university.edu', password: 'password', role: 'ADMIN', designation: 'Mess Incharge', name: 'Suresh Kumar (Mess)', departmentName: 'Registrar', authorityId: 'AUTH-103' },
  { email: 'counselor@university.edu', password: 'password', role: 'ADMIN', designation: 'Student Counselor', name: 'Ms. Priya (Counselor)', departmentName: 'Dean of Student Affairs', authorityId: 'AUTH-104' },
  { email: 'medicalofficer@university.edu', password: 'password', role: 'ADMIN', designation: 'Medical Officer', name: 'Dr. Gupta', departmentName: 'Senior Doctor', authorityId: 'AUTH-105' },
  { email: 'hod@university.edu', password: 'password', role: 'ADMIN', designation: 'HOD', name: 'Prof. Verma (HOD Academics)', departmentName: 'Dean of Academics', authorityId: 'AUTH-106' },

  // Level 1 (Admins)
  { email: 'chiefwarden@university.edu', password: 'password', role: 'ADMIN', designation: 'Chief Warden', name: 'Prof. Khanna (Chief Warden)', departmentName: 'Chief Warden', authorityId: 'AUTH-201' },
  { email: 'registrar@university.edu', password: 'password', role: 'ADMIN', designation: 'Registrar', name: 'Dr. S.P. Jain (Registrar)', departmentName: 'Registrar', authorityId: 'AUTH-202' },
  { email: 'deansa@university.edu', password: 'password', role: 'ADMIN', designation: 'Dean of Student Affairs', name: 'Prof. Malhotra (Dean SA)', departmentName: 'Dean of Student Affairs', authorityId: 'AUTH-203' },
  { email: 'cmo@university.edu', password: 'password', role: 'ADMIN', designation: 'Chief Medical Officer', name: 'Dr. Bansal (CMO)', departmentName: 'Senior Doctor', authorityId: 'AUTH-204' },
  { email: 'deanacad@university.edu', password: 'password', role: 'ADMIN', designation: 'Dean of Academics', name: 'Prof. Reddy (Dean Acad)', departmentName: 'Dean of Academics', authorityId: 'AUTH-205' },

  // Level 2 (Super Admin)
  { email: 'vc@university.edu', password: 'password', role: 'SUPER_ADMIN', designation: 'Vice Chancellor', name: 'Prof. S. Das (Vice Chancellor)', authorityId: 'AUTH-001' },
];

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Clean slate ──
  console.log('  🗑  Wiping existing data for fresh sync...');
  await prisma.escalationLog.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaint.deleteMany({});
  console.log('  ✅ Old data removed.\n');

  // Create departments
  const deptMap = {};
  for (const name of DEPARTMENTS) {
    let dept = await prisma.department.findUnique({ where: { name } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name } });
      console.log(`  ✅ Department: ${name}`);
    }
    deptMap[name] = dept.id;
  }

  // Create/Update users
  const userMap = {};
  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    const passwordHash = await bcrypt.hash(u.password, 10);
    
    const updates = {
      role: u.role,
      name: u.name || null,
      rollNo: u.rollNo || null,
      designation: u.designation || null,
      authorityId: u.authorityId || null,
      departmentId: deptMap[u.departmentName] || null
    };

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { email: u.email },
        data: updates
      });
      console.log(`  🔄 Updated User: ${u.email}`);
    } else {
      user = await prisma.user.create({
        data: {
          email: u.email,
          passwordHash,
          ...updates
        }
      });
      console.log(`  ✅ Created User: ${u.email}`);
    }
    userMap[u.email] = user.id;
  }

  // ── Seed some Sample Grievances ──
  console.log('\n  📝 Seeding sample grievances...');
  const studentId = userMap['student@university.edu'];
  const hodId = userMap['hod@university.edu'];
  const wardenId = userMap['warden@university.edu'];

  const sampleComplaints = [
    {
      title: 'Broken AC in Lab 102',
      description: 'The air conditioning in Lab 102 is not working for 3 days. It is very difficult to work in this heat.',
      category: 'Academics',
      severity: 'HIGH',
      visibility: 'PUBLIC',
      status: 'ASSIGNED',
      userId: studentId,
      assignedToId: hodId,
      departmentId: deptMap['Dean of Academics'],
      escalationChain: JSON.stringify([hodId, userMap['deanacad@university.edu'], userMap['vc@university.edu']]),
      currentChainIndex: 0
    },
    {
      title: 'Hostel Water Supply Issue',
      description: 'Water supply is intermittent in Block C. Please fix it urgently.',
      category: 'Hostel',
      severity: 'CRITICAL',
      visibility: 'PUBLIC',
      status: 'ASSIGNED',
      userId: studentId,
      assignedToId: wardenId,
      departmentId: deptMap['Chief Warden'],
      escalationChain: JSON.stringify([wardenId, userMap['chiefwarden@university.edu'], userMap['vc@university.edu']]),
      currentChainIndex: 0
    }
  ];

  for (const c of sampleComplaints) {
    const hashId = crypto.randomBytes(32).toString('hex');
    await prisma.complaint.create({
      data: {
        ...c,
        hashId,
        ipfsHash: 'Qm' + crypto.randomBytes(22).toString('hex'),
        slaDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
      }
    });
  }
  console.log('  ✅ Sample grievances seeded.');

  console.log('\n✨ Seed complete!\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

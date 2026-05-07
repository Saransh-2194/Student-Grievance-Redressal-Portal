import prisma from './lib/db.js';

async function testDelete(id) {
  try {
    console.log(`Trying to delete ticket: ${id}`);
    const res = await prisma.$transaction([
      prisma.vote.deleteMany({ where: { complaintId: id } }),
      prisma.comment.deleteMany({ where: { complaintId: id } }),
      prisma.activityLog.deleteMany({ where: { complaintId: id } }),
      prisma.escalationLog.deleteMany({ where: { complaintId: id } }),
      prisma.feedback.deleteMany({ where: { complaintId: id } }),
      prisma.complaint.delete({ where: { id: id } })
    ]);
    console.log('Success:', res);
  } catch (err) {
    console.error('FAILED:', err);
  } finally {
    await prisma.$disconnect();
  }
}

const targetId = process.argv[2];
if (!targetId) {
  console.log('Provide ticket ID');
} else {
  testDelete(targetId);
}

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.complaint.count();
  const complaints = await prisma.complaint.findMany({
    take: 5,
    include: {
      user: true,
      department: true
    }
  });
  console.log('Total Complaints:', count);
  console.log('Recent Complaints:', JSON.stringify(complaints, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

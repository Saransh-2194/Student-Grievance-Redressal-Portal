import cron from 'node-cron';
import prisma from './lib/db.js';
import { updateBlockchainStatus } from './lib/blockchain.js';
import { isSlaBreached } from './lib/sla.js';
import { notifySlaBreach } from './lib/notifications.js';
import { getIo } from './lib/socket.js';

export const initWorker = () => {
  // Run every 30 minutes for higher precision in SLA enforcement
  cron.schedule('*/30 * * * *', async () => {
    console.log('[SLA-Worker] Checking for SLA breaches and escalations...');
    try {
      const activeTickets = await prisma.complaint.findMany({
        where: {
          status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] },
          slaBreached: false
        }
      });

      for (const ticket of activeTickets) {
        if (isSlaBreached(ticket.slaDeadline)) {
          console.log(`[SLA-Worker] SLA BREACH: Ticket ${ticket.id}`);
          
          // 1. Update Database
          await prisma.complaint.update({
            where: { id: ticket.id },
            data: { 
              status: 'ESCALATED',
              slaBreached: true
            }
          });

          // 2. Audit Log
          await prisma.activityLog.create({
            data: {
              complaintId: ticket.id,
              action: 'SLA_BREACH',
              oldValue: ticket.status,
              newValue: 'ESCALATED',
              details: `SLA breached for severity ${ticket.severity}. Deadline was ${ticket.slaDeadline}`
            }
          });

          // 3. Sync to Blockchain (Status 6 = ESCALATED)
          await updateBlockchainStatus("0x" + ticket.hashId, 6).catch(console.error);

          // 4. Real-time & Notifications
          getIo().emit('status-updated', { ticketId: ticket.id, status: 'ESCALATED' });
          // Fetch authority emails
          const authorities = await prisma.user.findMany({ where: { role: 'AUTHORITY' } });
          authorities.forEach(auth => {
            notifySlaBreach(auth.id, auth.email, ticket.id, ticket.severity).catch(console.error);
          });
        }
      }

      // Check for impact-score based high-priority escalations (Jira-like "Hot" tickets)
      // Logic: If impact score (votes) is very high, auto-escalate regardless of SLA
      const highImpactTickets = await prisma.complaint.findMany({
        where: {
          status: { in: ['CREATED', 'ASSIGNED', 'IN_PROGRESS'] },
          visibility: 'PUBLIC'
        },
        include: { votes: true }
      });

      for (const ticket of highImpactTickets) {
        let up = 0; let down = 0;
        ticket.votes.forEach(v => v.type === 'UP' ? up++ : down++);
        const score = up - down;

        if (score >= 50) { // Threshold for "Viral/High Impact" tickets
          await prisma.complaint.update({
            where: { id: ticket.id },
            data: { status: 'ESCALATED' }
          });
          
          await prisma.activityLog.create({
            data: {
              complaintId: ticket.id,
              action: 'HIGH_IMPACT_ESCALATION',
              details: `Ticket escalated due to high student impact score (${score})`
            }
          });
        }
      }

    } catch (err) {
      console.error('[SLA-Worker] Error:', err);
    }
  });
  
  console.log('[SLA-Worker] Service initialized');
};

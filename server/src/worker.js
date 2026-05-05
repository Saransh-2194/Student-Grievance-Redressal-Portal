import cron from 'node-cron';
import prisma from './lib/db.js';
import { updateBlockchainStatus, logBlockchainEscalation } from './lib/blockchain.js';
import { isSlaBreached } from './lib/sla.js';
import { notifySlaBreach, createNotification } from './lib/notifications.js';
import { getIo } from './lib/socket.js';
import { getNextInChain, isTerminal } from './lib/hierarchy.js';

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
          
          // ── Array-Index Escalation ──
          const chain = ticket.escalationChain ? JSON.parse(ticket.escalationChain) : [];
          const currentIndex = ticket.currentChainIndex;
          const canEscalate = chain.length > 0 && !isTerminal(chain, currentIndex);

          if (canEscalate) {
            // Move to next authority in chain
            const nextIndex = currentIndex + 1;
            const nextAuthorityId = chain[nextIndex];

            // 1. Update Database
            await prisma.complaint.update({
              where: { id: ticket.id },
              data: { 
                status: 'ESCALATED',
                slaBreached: true,
                isEscalated: true,
                currentChainIndex: nextIndex,
                assignedToId: nextAuthorityId
              }
            });

            // 2. Escalation Log
            await prisma.escalationLog.create({
              data: {
                complaintId: ticket.id,
                fromIndex: currentIndex,
                toIndex: nextIndex,
                fromAuthority: ticket.assignedToId,
                toAuthority: nextAuthorityId,
                reason: 'SLA_BREACH'
              }
            });

            // 3. Activity/Audit Log
            const nextUser = await prisma.user.findUnique({ where: { id: nextAuthorityId }, select: { email: true, designation: true } });
            await prisma.activityLog.create({
              data: {
                complaintId: ticket.id,
                action: 'SLA_BREACH',
                oldValue: ticket.status,
                newValue: 'ESCALATED',
                details: `SLA breached for severity ${ticket.severity}. Auto-escalated to ${nextUser?.designation || 'Next Authority'} (Level ${nextIndex})`
              }
            });

            // 4. Sync to Blockchain
            try {
              if (ticket.hashId) {
                await logBlockchainEscalation("0x" + ticket.hashId, currentIndex, nextIndex);
              }
            } catch (bcErr) {
              console.warn(`[SLA-Worker] Blockchain escalation log failed for ${ticket.id}`);
            }

            // 5. Real-time & Notifications
            getIo().to(`ticket-${ticket.id}`).emit('status-updated', { ticketId: ticket.id, status: 'ESCALATED' });
            // Notify old authority
            if (ticket.assignedToId) {
              getIo().to(`user-${ticket.assignedToId}`).emit('ticket-updated', { ticketId: ticket.id, status: 'ESCALATED' });
            }
            // Notify new authority
            getIo().to(`user-${nextAuthorityId}`).emit('new-ticket', { id: ticket.id, title: ticket.title, status: 'ESCALATED' });
            createNotification(nextAuthorityId, 'DANGER', `SLA breached: Ticket "${ticket.title}" escalated to you.`, '/dashboard/admin').catch(console.error);
            // Notify student
            getIo().to(`user-${ticket.userId}`).emit('ticket-updated', { ticketId: ticket.id, status: 'ESCALATED' });
            createNotification(ticket.userId, 'WARNING', `Your ticket "${ticket.title}" has been auto-escalated due to SLA breach.`, '/dashboard/my').catch(console.error);

            console.log(`[SLA-Worker] Ticket ${ticket.id} escalated from Level ${currentIndex} to Level ${nextIndex}`);

          } else {
            // No chain or at terminal — just mark as breached
            await prisma.complaint.update({
              where: { id: ticket.id },
              data: { 
                status: 'ESCALATED',
                slaBreached: true,
                isEscalated: true
              }
            });

            await prisma.activityLog.create({
              data: {
                complaintId: ticket.id,
                action: 'SLA_BREACH',
                oldValue: ticket.status,
                newValue: 'ESCALATED',
                details: `SLA breached for severity ${ticket.severity}. At terminal authority — no further escalation possible.`
              }
            });

            // Blockchain sync
            try {
              if (ticket.hashId) {
                await updateBlockchainStatus("0x" + ticket.hashId, 6); // 6 = ESCALATED
              }
            } catch (bcErr) {
              console.warn(`[SLA-Worker] Blockchain status update failed for ${ticket.id}`);
            }

            getIo().to(`ticket-${ticket.id}`).emit('status-updated', { ticketId: ticket.id, status: 'ESCALATED' });
            if (ticket.assignedToId) {
              getIo().to(`user-${ticket.assignedToId}`).emit('ticket-updated', { ticketId: ticket.id, status: 'ESCALATED' });
            }

            // Notify all authorities about terminal breach
            const authorities = await prisma.user.findMany({ where: { role: 'AUTHORITY' } });
            authorities.forEach(auth => {
              notifySlaBreach(auth.id, auth.email, ticket.id, ticket.severity).catch(console.error);
            });
          }
        }
      }

      // Check for impact-score based high-priority escalations (Jira-like "Hot" tickets)
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
          const chain = ticket.escalationChain ? JSON.parse(ticket.escalationChain) : [];
          const currentIndex = ticket.currentChainIndex;
          const canEscalate = chain.length > 0 && !isTerminal(chain, currentIndex);

          const nextIndex = canEscalate ? currentIndex + 1 : currentIndex;
          const nextAuthorityId = canEscalate ? chain[nextIndex] : ticket.assignedToId;

          await prisma.complaint.update({
            where: { id: ticket.id },
            data: { 
              status: 'ESCALATED',
              isEscalated: true,
              ...(canEscalate && { currentChainIndex: nextIndex, assignedToId: nextAuthorityId })
            }
          });

          if (canEscalate) {
            await prisma.escalationLog.create({
              data: {
                complaintId: ticket.id,
                fromIndex: currentIndex,
                toIndex: nextIndex,
                fromAuthority: ticket.assignedToId,
                toAuthority: nextAuthorityId,
                reason: 'HIGH_IMPACT'
              }
            });
          }
          
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
  
  console.log('[SLA-Worker] Service initialized (with hierarchy escalation)');
};

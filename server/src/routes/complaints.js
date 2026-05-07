import express from 'express';
import crypto from 'crypto';
import prisma from '../lib/db.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { validateComplaint, validateVote, validateStatusUpdate } from '../middlewares/validate.js';
import { createBlockchainComplaint, updateBlockchainStatus, logBlockchainEscalation } from '../lib/blockchain.js';
import { canTransition, getWorkflowError } from '../lib/workflow.js';
import { calculateSlaDeadline, isSlaBreached } from '../lib/sla.js';
import { getIo } from '../lib/socket.js';
import { notifyStatusChange, notifyAssignment, createNotification } from '../lib/notifications.js';
import { buildChainForTicket, getNextInChain, isTerminal, getChainWithPositions } from '../lib/hierarchy.js';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = express.Router();

// Category -> Department mapping
const CATEGORY_DEPARTMENT_MAP = {
  'Housekeeping': 'Registrar',
  'Academics': 'Dean of Academics',
  'Student Affairs': 'Dean of Student Affairs',
  'Medical': 'Senior Doctor',
  'Hostel': 'Chief Warden',
  'Mess & Canteen': 'Registrar',
  'Personal': 'Registrar',
  'General Issues': 'Dean of Student Affairs',
};
// S3 Client Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(null, `proofs/${Date.now().toString()}-${file.originalname}`);
    }
  })
});
// Helper to generate a signed S3 URL for private files
const getSignedAttachmentUrl = async (url) => {
  if (!url) return null;
  try {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    // Extract key from the S3 URL format
    const delimiter = `${bucketName}.s3.${region}.amazonaws.com/`;
    const urlParts = url.split(delimiter);
    if (urlParts.length < 2) return url;
    
    const key = urlParts[1];
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
    return await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
  } catch (err) {
    return url;
  }
};

/**
 * Helper to transform a complaint object:
 * 1. Calculates impact score
 * 2. Signs S3 attachmentUrl if present
 * 3. Signs S3 resolutionProof if present
 */
const transformComplaint = async (c, currentUserId = null, requesterRole = null) => {
  let up = 0; let down = 0;
  if (c.votes) {
    c.votes.forEach(v => v.type === 'UP' ? up++ : down++);
  }
  const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[c.severity] || 1;
  const score = (up - down) * weight;
  
  const signedAttachmentUrl = await getSignedAttachmentUrl(c.attachmentUrl);
  const signedResolutionProof = await getSignedAttachmentUrl(c.resolutionProof);

  return { 
    ...c, 
    impactScore: score, 
    upvotes: up, 
    downvotes: down, 
    attachmentUrl: signedAttachmentUrl,
    resolutionProof: signedResolutionProof,
    // Only mask identity for other students or non-admins
    user: (c.isAnonymous && requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') 
      ? { email: 'Anonymous student', role: 'STUDENT', name: 'Anonymous', rollNo: 'HIDDEN' } 
      : c.user,
    // Mask comment authors if they are the original student on an anonymous ticket
    comments: c.comments?.map(com => ({
      ...com,
      user: (c.isAnonymous && com.userId === c.userId && requesterRole !== 'ADMIN' && requesterRole !== 'SUPER_ADMIN') 
        ? { email: 'Anonymous student', role: 'STUDENT', name: 'Anonymous' } 
        : com.user
    })),
    isOwner: c.userId === currentUserId,
    userId: undefined, // Hide real userId from client
    votes: undefined 
  };
};

// ──────────────────────────────────────────────
// GET /complaints/public — Public complaints sorted by impact score
// ──────────────────────────────────────────────
router.get('/public', async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { visibility: 'PUBLIC' },
      include: {
        votes: true,
        department: true,
        user: { select: { email: true, role: true, name: true, rollNo: true } },
        assignedTo: { select: { email: true, role: true, name: true, designation: true } },
        comments: { include: { user: { select: { email: true, role: true, name: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(c => transformComplaint(c)));

    scored.sort((a, b) => b.impactScore - a.impactScore);
    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/escalated — Escalated complaints
// ──────────────────────────────────────────────
router.get('/escalated', verifyToken, async (req, res) => {
  try {
    const where = { status: 'ESCALATED' };
    // Students only see public escalated
    if (req.user.role === 'STUDENT') {
      where.visibility = 'PUBLIC';
    }
    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        votes: true,
        department: true,
        user: { select: { email: true, role: true, name: true, rollNo: true } },
        assignedTo: { select: { email: true, role: true, name: true, designation: true } },
        comments: { include: { user: { select: { email: true, role: true, name: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(c => transformComplaint(c, req.user?.id, req.user?.role)));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/mine — Student's own complaints
// ──────────────────────────────────────────────
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: { userId: req.user.id },
      include: {
        votes: true,
        department: true,
        user: { select: { email: true, role: true, name: true, rollNo: true } },
        assignedTo: { select: { email: true, role: true, name: true, designation: true } },
        comments: { include: { user: { select: { email: true, role: true, name: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(c => transformComplaint(c, req.user?.id, req.user?.role)));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/department — Department admin's assigned complaints
// ──────────────────────────────────────────────
router.get('/department', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    if (!req.user.departmentId) {
      return res.json([]);
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        departmentId: req.user.departmentId,
        visibility: 'PUBLIC' // Admins don't see personal complaints
      },
      include: {
        votes: true,
        department: true,
        user: { select: { email: true, role: true, name: true, rollNo: true } },
        assignedTo: { select: { email: true, role: true, name: true, designation: true } },
        comments: { include: { user: { select: { email: true, role: true, name: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(c => transformComplaint(c, req.user?.id, req.user?.role)));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/all — Authority sees everything
// ──────────────────────────────────────────────
router.get('/all', verifyToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        votes: true,
        department: true,
        user: { select: { email: true, role: true, name: true, rollNo: true } },
        assignedTo: { select: { email: true, role: true, name: true, designation: true } },
        comments: { include: { user: { select: { email: true, role: true, name: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(c => transformComplaint(c, req.user?.id, req.user?.role)));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/audit-log — Full audit trail
// ──────────────────────────────────────────────
router.get('/audit-log', verifyToken, requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const logs = await prisma.escalationLog.findMany({
      include: {
        complaint: { select: { title: true, hashId: true, category: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// POST /complaints — Submit a new complaint (with optional attachment)
// ──────────────────────────────────────────────
router.post('/', verifyToken, upload.single('attachment'), validateComplaint, async (req, res) => {
  const { title, description, category, severity, visibility, isAnonymous } = req.body;
  const attachmentUrl = req.file ? req.file.location : null;

  try {
    const hashId = crypto.randomBytes(32).toString('hex');
    const mockIpfsHash = 'Qm' + crypto.randomBytes(22).toString('hex');

    // Auto-route to department based on category
    const deptName = CATEGORY_DEPARTMENT_MAP[category] || 'Dean of Student Affairs';
    let dept = await prisma.department.findUnique({ where: { name: deptName } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name: deptName } });
    }

    // Personal complaints bypass department routing
    const assignedDeptId = visibility === 'PERSONAL' ? null : dept.id;

    // ── Hierarchy Chain Resolution ──
    const { chain, firstAuthority } = await buildChainForTicket(category, assignedDeptId);

    const complaint = await prisma.complaint.create({
      data: {
        hashId,
        title,
        description,
        category,
        severity,
        visibility,
        status: firstAuthority ? 'ASSIGNED' : 'CREATED',
        ipfsHash: mockIpfsHash,
        attachmentUrl,
        isAnonymous: isAnonymous === 'true' || isAnonymous === true,
        userId: req.user.id,
        departmentId: assignedDeptId,
        slaDeadline: calculateSlaDeadline(severity),
        // Hierarchy fields
        escalationChain: JSON.stringify(chain),
        currentChainIndex: 0,
        assignedToId: firstAuthority
      }
    });

    // Submit to blockchain asynchronously
    createBlockchainComplaint("0x" + hashId, mockIpfsHash).then(tx => {
      if (tx) {
        prisma.complaint.update({
          where: { id: complaint.id },
          data: { txHash: tx }
        }).catch(console.error);
      }
    });

    // Initial Audit Log
    await prisma.activityLog.create({
      data: {
        complaintId: complaint.id,
        action: 'TICKET_CREATED',
        details: `Ticket created with severity ${severity}. Auto-assigned to chain[0].`,
        userId: req.user.id
      }
    });

    // Notify assigned authority via their user room
    if (firstAuthority) {
      getIo().to(`user-${firstAuthority}`).emit('new-ticket', complaint);
      const assignedUser = await prisma.user.findUnique({ where: { id: firstAuthority } });
      if (assignedUser) {
        createNotification(firstAuthority, 'INFO', `New ticket assigned to you: "${title}"`, '/dashboard/admin').catch(console.error);
      }
    }

    // Also notify department room for visibility
    if (assignedDeptId) {
      getIo().to(`dept-${assignedDeptId}`).emit('new-ticket', complaint);
    }

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/:id/chain — Get hierarchy chain with positions for UI
// ──────────────────────────────────────────────
router.get('/:id/chain', verifyToken, async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      select: { escalationChain: true, currentChainIndex: true, category: true }
    });

    if (!complaint) return res.status(404).json({ error: "Not found" });

    if (!complaint.escalationChain) {
      return res.json({ chain: [], currentIndex: 0 });
    }

    const positions = await getChainWithPositions(complaint.escalationChain, complaint.currentChainIndex);
    
    // Also fetch escalation logs for this ticket
    const escalationLogs = await prisma.escalationLog.findMany({
      where: { complaintId: req.params.id },
      orderBy: { timestamp: 'asc' }
    });

    res.json({ 
      chain: positions, 
      currentIndex: complaint.currentChainIndex,
      category: complaint.category,
      escalationLogs 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/:id/timeline — Full audit trail
// ──────────────────────────────────────────────
router.get('/:id/timeline', verifyToken, async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { complaintId: req.params.id },
      orderBy: { timestamp: 'asc' },
      include: { 
        complaint: { select: { title: true, hashId: true } }
      }
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/:id — Single complaint detail
// ──────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: {
        votes: true,
        escalationLogs: { orderBy: { timestamp: 'asc' } },
        department: true
      }
    });

    if (!complaint) return res.status(404).json({ error: "Not found" });

    if (complaint.visibility === 'PERSONAL' && req.user.id !== complaint.userId && req.user.role !== 'AUTHORITY') {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(await transformComplaint(complaint, req.user?.id, req.user?.role));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// POST /complaints/:id/vote — Vote on a complaint
// ──────────────────────────────────────────────
router.post('/:id/vote', verifyToken, validateVote, async (req, res) => {
  const { type } = req.body;
  const complaintId = req.params.id;
  const userId = req.user.id;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });

    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (complaint.visibility === 'PERSONAL') return res.status(400).json({ error: "Cannot vote on personal complaints" });

    const vote = await prisma.vote.upsert({
      where: { userId_complaintId: { userId, complaintId } },
      update: { type },
      create: { type, userId, complaintId }
    });

    res.json(vote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /complaints/:id/status — Update status with Workflow enforcement
router.put('/:id/status', verifyToken, upload.single('proof'), async (req, res) => {
  const { status, resolutionProof: note } = req.body;
  const complaintId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return res.status(404).json({ error: "Ticket not found" });

    const oldStatus = complaint.status;

    // 0. Safety: Ignore if status is unchanged
    if (oldStatus === status) {
      return res.json(complaint);
    }

    // 1. Workflow Rule Check
    if (!canTransition(oldStatus, status)) {
      return res.status(400).json({ error: getWorkflowError(oldStatus, status) });
    }

    // 2. RBAC Enforcement
    if (userRole === 'STUDENT') {
      if (complaint.userId !== userId) return res.status(403).json({ error: "Access denied" });
      if (oldStatus === 'RESOLVED' && (status === 'CLOSED' || status === 'IN_PROGRESS')) {
        // Valid student transitions: Confirmation or Reopening
      } else {
        return res.status(403).json({ error: "Students can only confirm resolution or reopen." });
      }
    } else if (userRole === 'ADMIN') {
      // Admins must belong to the same department as the ticket
      if (complaint.departmentId !== req.user.departmentId) {
        return res.status(403).json({ error: "This grievance does not belong to your department." });
      }
      
      // Strict Enforcement: Only the assigned admin can update the status
      // If unassigned, they can take it over. If assigned to someone else, they are blocked.
      if (complaint.assignedToId && complaint.assignedToId !== userId) {
        return res.status(403).json({ error: "This ticket is assigned to another authority. Only the assignee can resolve it." });
      }
    } else if (userRole !== 'SUPER_ADMIN') {
      // Non-students/non-admins/non-superadmins are blocked
      return res.status(403).json({ error: "Access denied" });
    }

    const data = { status };

    // Auto-assign to resolver if unassigned
    if (!complaint.assignedToId && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
      data.assignedToId = userId;
    }
    
    // Handle file upload
    if (req.file) {
      data.resolutionProof = req.file.location; // S3 URL
    } else if (note) {
      data.resolutionProof = note;
    }

    if (status === 'RESOLVED') data.resolvedAt = new Date();
    if (status === 'IN_PROGRESS' && !complaint.respondedAt) data.respondedAt = new Date();

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data
    });

    // 3. Activity Log
    await prisma.activityLog.create({
      data: {
        complaintId,
        action: 'STATUS_CHANGE',
        oldValue: oldStatus,
        newValue: status,
        details: data.resolutionProof || "Status updated",
        userId
      }
    });

    // 4. Blockchain Sync (Safe Catch for legacy tickets)
    const statusMap = { 'CREATED': 0, 'ASSIGNED': 1, 'IN_PROGRESS': 2, 'UNDER_REVIEW': 3, 'RESOLVED': 4, 'CLOSED': 5, 'ESCALATED': 6 };
    try {
      if (complaint.hashId) {
        await updateBlockchainStatus("0x" + complaint.hashId, statusMap[status]);
      }
    } catch (bcErr) {
      console.warn(`[BC-Sync-Skip] Ticket ${complaintId} chain update failed. DB sync only.`);
    }

    // 5. Real-time & Notifications
    getIo().to(`ticket-${complaintId}`).emit('status-updated', { ticketId: complaintId, status });
    getIo().to(`dept-${complaint.departmentId}`).emit('ticket-updated', { ticketId: complaintId, status });
    // Notify the student's personal room
    getIo().to(`user-${complaint.userId}`).emit('ticket-updated', { ticketId: complaintId, status });
    // Notify the assigned admin's personal room (critical for reopen visibility)
    if (complaint.assignedToId) {
      getIo().to(`user-${complaint.assignedToId}`).emit('ticket-updated', { ticketId: complaintId, status });
    }
    
    // Notifications: admin actions → notify student; student actions → notify admin
    if (userRole === 'ADMIN' || userRole === 'AUTHORITY') {
      const student = await prisma.user.findUnique({ where: { id: complaint.userId } });
      if (student) {
        notifyStatusChange(student.id, student.email, complaint.title, oldStatus, status).catch(console.error);
      }
    } else if (userRole === 'STUDENT' && status === 'IN_PROGRESS' && complaint.assignedToId) {
      // Student reopened — notify the admin
      createNotification(complaint.assignedToId, 'WARNING', `Ticket "${complaint.title}" was reopened by student.`, '/dashboard/admin').catch(console.error);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /complaints/:id/assign — Assign ticket
router.post('/:id/assign', verifyToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const { userId: assignToId } = req.body || {};
  const complaintId = req.params.id;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return res.status(404).json({ error: "Ticket not found" });

    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: { 
        assignedToId: assignToId || req.user.id,
        status: 'ASSIGNED'
      }
    });

    await prisma.activityLog.create({
      data: {
        complaintId,
        action: 'ASSIGNMENT',
        newValue: assignToId || req.user.id,
        userId: req.user.id
      }
    });

    // Blockchain Sync (Safe)
    try {
      if (complaint.hashId) {
        await updateBlockchainStatus("0x" + complaint.hashId, 1); // 1 = ASSIGNED
      }
    } catch (bcErr) {
       console.warn(`[BC-Sync-Skip] Ticket ${complaintId} assignment chain update failed.`);
    }

    // Real-time & Notification
    getIo().to(`ticket-${complaintId}`).emit('status-updated', { ticketId: complaintId, status: 'ASSIGNED' });
    getIo().to(`dept-${complaint.departmentId}`).emit('ticket-updated', { ticketId: complaintId, status: 'ASSIGNED' });
    
    const student = await prisma.user.findUnique({ where: { id: complaint.userId } });
    if (student) {
      notifyAssignment(student.id, student.email, complaint.title, req.user.email.split('@')[0]).catch(console.error);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /complaints/:id/comment — Add comment
router.post('/:id/comment', verifyToken, upload.single('attachment'), async (req, res) => {
  const { text } = req.body;
  const complaintId = req.params.id;
  const attachmentUrl = req.file ? req.file.location : null;

  try {
    const comment = await prisma.comment.create({
      data: {
        text,
        attachmentUrl,
        complaintId,
        userId: req.user.id
      }
    });

    await prisma.activityLog.create({
      data: {
        complaintId,
        action: 'COMMENT_ADDED',
        details: text.substring(0, 50),
        userId: req.user.id
      }
    });

    // Real-time Update
    const commentWithUser = await prisma.comment.findUnique({
      where: { id: comment.id },
      include: { user: { select: { email: true, role: true } } }
    });
    getIo().to(`ticket-${complaintId}`).emit('new-comment', commentWithUser);

    // Notification: If admin comments, notify student
    if (req.user.role === 'ADMIN' || req.user.role === 'AUTHORITY') {
      const student = await prisma.user.findUnique({ where: { id: complaint.userId } });
      if (student) {
        createNotification(student.id, 'INFO', `New update from Admin on: ${complaint.title}`, `/tickets`).catch(console.error);
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// ──────────────────────────────────────────────
// POST /complaints/:id/escalate — Manual escalation (Array-Index approach)
// ──────────────────────────────────────────────
router.post('/:id/escalate', verifyToken, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const complaintId = req.params.id;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return res.status(404).json({ error: "Ticket not found" });

    if (!complaint.escalationChain) {
      return res.status(400).json({ error: "No escalation chain configured for this ticket." });
    }

    const chain = JSON.parse(complaint.escalationChain);
    const currentIndex = complaint.currentChainIndex;

    // Check if at terminal authority
    if (isTerminal(chain, currentIndex)) {
      return res.status(400).json({ error: "Ticket is already at the highest authority level. Cannot escalate further." });
    }

    const nextIndex = currentIndex + 1;
    const nextAuthorityId = chain[nextIndex];

    // Update the ticket
    const updated = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        currentChainIndex: nextIndex,
        assignedToId: nextAuthorityId,
        status: 'ESCALATED',
        isEscalated: true
      }
    });

    // Create escalation log
    await prisma.escalationLog.create({
      data: {
        complaintId,
        fromIndex: currentIndex,
        toIndex: nextIndex,
        fromAuthority: complaint.assignedToId,
        toAuthority: nextAuthorityId,
        reason: 'MANUAL'
      }
    });

    // Activity log
    const nextUser = await prisma.user.findUnique({ where: { id: nextAuthorityId }, select: { email: true, designation: true } });
    await prisma.activityLog.create({
      data: {
        complaintId,
        action: 'ESCALATION',
        oldValue: `Level ${currentIndex}`,
        newValue: `Level ${nextIndex}`,
        details: `Manually escalated to ${nextUser?.designation || nextUser?.email || 'Next Authority'}`,
        userId: req.user.id
      }
    });

    // Blockchain sync
    try {
      if (complaint.hashId) {
        await logBlockchainEscalation("0x" + complaint.hashId, currentIndex, nextIndex);
      }
    } catch (bcErr) {
      console.warn(`[BC-Sync-Skip] Escalation chain log failed for ticket ${complaintId}`);
    }

    // Real-time notifications
    getIo().to(`ticket-${complaintId}`).emit('status-updated', { ticketId: complaintId, status: 'ESCALATED' });
    getIo().to(`user-${complaint.assignedToId}`).emit('ticket-updated', { ticketId: complaintId, status: 'ESCALATED' });
    getIo().to(`user-${nextAuthorityId}`).emit('new-ticket', updated);
    getIo().to(`user-${complaint.userId}`).emit('ticket-updated', { ticketId: complaintId, status: 'ESCALATED' });

    // Notify the new authority
    createNotification(nextAuthorityId, 'WARNING', `Escalated ticket assigned to you: "${complaint.title}"`, '/dashboard/admin').catch(console.error);
    // Notify the student
    createNotification(complaint.userId, 'INFO', `Your ticket "${complaint.title}" has been escalated to a higher authority.`, '/dashboard/my').catch(console.error);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// DELETE /complaints/:id — Delete grievance (Owner or Super Admin)
router.delete('/:id', verifyToken, async (req, res) => {
  const complaintId = req.params.id;
  const { id: userId, role: userRole } = req.user;
  console.log(`[DELETE] Request for ${complaintId} by ${userId} (${userRole})`);

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return res.status(404).json({ error: "Ticket not found" });

    // Authorization: ONLY the student owner can delete their own ticket
    if (complaint.userId !== userId) {
      return res.status(403).json({ error: "Only the student who created this ticket can delete it." });
    }

    // Optional: Prevent deletion if already being handled/resolved?
    // if (userRole === 'STUDENT' && !['CREATED', 'ASSIGNED'].includes(complaint.status)) {
    //   return res.status(400).json({ error: "Cannot delete a ticket that is already in progress or resolved" });
    // }

    // Use transaction to ensure full cleanup
    await prisma.$transaction([
      prisma.vote.deleteMany({ where: { complaintId } }),
      prisma.comment.deleteMany({ where: { complaintId } }),
      prisma.activityLog.deleteMany({ where: { complaintId } }),
      prisma.escalationLog.deleteMany({ where: { complaintId } }),
      prisma.feedback.deleteMany({ where: { complaintId } }),
      prisma.complaint.delete({ where: { id: complaintId } })
    ]);

    // Notify via Socket
    getIo().emit('ticket-deleted', { ticketId: complaintId });

    res.json({ message: "Ticket deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

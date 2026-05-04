import express from 'express';
import crypto from 'crypto';
import prisma from '../lib/db.js';
import { verifyToken, requireRole } from '../middlewares/auth.js';
import { validateComplaint, validateVote, validateStatusUpdate } from '../middlewares/validate.js';
import { createBlockchainComplaint, updateBlockchainStatus } from '../lib/blockchain.js';
import { canTransition, getWorkflowError } from '../lib/workflow.js';
import { calculateSlaDeadline, isSlaBreached } from '../lib/sla.js';
import { getIo } from '../lib/socket.js';
import { notifyStatusChange, notifyAssignment, createNotification } from '../lib/notifications.js';
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
        assignedTo: { select: { email: true, role: true } },
        comments: { include: { user: { select: { email: true, role: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(async (c) => {
      let up = 0; let down = 0;
      c.votes.forEach(v => v.type === 'UP' ? up++ : down++);
      const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[c.severity] || 1;
      const score = (up - down) * weight;
      
      const signedUrl = await getSignedAttachmentUrl(c.attachmentUrl);

      return { 
        ...c, 
        impactScore: score, 
        upvotes: up, 
        downvotes: down, 
        attachmentUrl: signedUrl,
        votes: undefined 
      };
    }));

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
        assignedTo: { select: { email: true, role: true } },
        comments: { include: { user: { select: { email: true, role: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(async (c) => {
      let up = 0; let down = 0;
      c.votes.forEach(v => v.type === 'UP' ? up++ : down++);
      const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[c.severity] || 1;
      
      const signedUrl = await getSignedAttachmentUrl(c.attachmentUrl);
      return { 
        ...c, 
        impactScore: (up - down) * weight, 
        upvotes: up, 
        downvotes: down, 
        attachmentUrl: signedUrl,
        votes: undefined 
      };
    }));

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
        assignedTo: { select: { email: true, role: true } },
        comments: { include: { user: { select: { email: true, role: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(async (c) => {
      let up = 0; let down = 0;
      c.votes.forEach(v => v.type === 'UP' ? up++ : down++);
      const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[c.severity] || 1;
      
      const signedUrl = await getSignedAttachmentUrl(c.attachmentUrl);
      return { 
        ...c, 
        impactScore: (up - down) * weight, 
        upvotes: up, 
        downvotes: down, 
        attachmentUrl: signedUrl,
        votes: undefined 
      };
    }));

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
        assignedTo: { select: { email: true, role: true } },
        comments: { include: { user: { select: { email: true, role: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(async (c) => {
      let up = 0; let down = 0;
      c.votes.forEach(v => v.type === 'UP' ? up++ : down++);
      const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[c.severity] || 1;
      
      const signedUrl = await getSignedAttachmentUrl(c.attachmentUrl);
      return { 
        ...c, 
        impactScore: (up - down) * weight, 
        upvotes: up, 
        downvotes: down, 
        attachmentUrl: signedUrl,
        votes: undefined 
      };
    }));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/all — Authority sees everything
// ──────────────────────────────────────────────
router.get('/all', verifyToken, requireRole(['AUTHORITY']), async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        votes: true,
        department: true,
        assignedTo: { select: { email: true, role: true } },
        comments: { include: { user: { select: { email: true, role: true } } } },
        activityLogs: { orderBy: { timestamp: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const scored = await Promise.all(complaints.map(async (c) => {
      let up = 0; let down = 0;
      c.votes.forEach(v => v.type === 'UP' ? up++ : down++);
      const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[c.severity] || 1;
      
      const signedUrl = await getSignedAttachmentUrl(c.attachmentUrl);
      return { 
        ...c, 
        impactScore: (up - down) * weight, 
        upvotes: up, 
        downvotes: down, 
        attachmentUrl: signedUrl,
        votes: undefined 
      };
    }));

    res.json(scored);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ──────────────────────────────────────────────
// GET /complaints/audit-log — Full audit trail
// ──────────────────────────────────────────────
router.get('/audit-log', verifyToken, requireRole(['AUTHORITY']), async (req, res) => {
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
  const { title, description, category, severity, visibility } = req.body;
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

    const complaint = await prisma.complaint.create({
      data: {
        hashId,
        title,
        description,
        category,
        severity,
        visibility,
        status: 'CREATED',
        ipfsHash: mockIpfsHash,
        attachmentUrl,
        userId: req.user.id,
        departmentId: assignedDeptId,
        slaDeadline: calculateSlaDeadline(severity)
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
        details: `Ticket created with severity ${severity}`,
        userId: req.user.id
      }
    });

    // Notify department staff
    if (assignedDeptId) {
      console.log(`[Socket] Emitting new-ticket to dept-${assignedDeptId}`);
      getIo().to(`dept-${assignedDeptId}`).emit('new-ticket', complaint);
    }

    res.status(201).json(complaint);
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

    let up = 0; let down = 0;
    complaint.votes.forEach(v => v.type === 'UP' ? up++ : down++);
    const weight = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 5 }[complaint.severity] || 1;

    const signedUrl = await getSignedAttachmentUrl(complaint.attachmentUrl);

    res.json({ 
      ...complaint, 
      impactScore: (up - down) * weight, 
      upvotes: up, 
      downvotes: down, 
      attachmentUrl: signedUrl,
      votes: undefined 
    });
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
      if (complaint.assignedToId !== userId && status !== 'ASSIGNED') {
         return res.status(403).json({ error: "You must claim this ticket first." });
      }
    }

    const data = { status };
    
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
    console.log(`[Socket] Emitting status-updated to ticket-${complaintId} and dept-${complaint.departmentId}`);
    getIo().to(`ticket-${complaintId}`).emit('status-updated', { ticketId: complaintId, status });
    getIo().to(`dept-${complaint.departmentId}`).emit('ticket-updated', { ticketId: complaintId, status });
    
    const student = await prisma.user.findUnique({ where: { id: complaint.userId } });
    if (student) {
      notifyStatusChange(student.id, student.email, complaint.title, oldStatus, status).catch(console.error);
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /complaints/:id/assign — Assign ticket
router.post('/:id/assign', verifyToken, requireRole(['ADMIN', 'AUTHORITY']), async (req, res) => {
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

// GET /complaints/:id/timeline — Full audit trail
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

export default router;

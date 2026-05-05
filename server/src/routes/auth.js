import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/db.js';
import { validateRegister, validateLogin } from '../middlewares/validate.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-jwt';

// Helper to seed standard departments if they don't exist
const ensureDepartment = async (name) => {
  let dept = await prisma.department.findUnique({ where: { name } });
  if (!dept) {
    dept = await prisma.department.create({ data: { name } });
  }
  return dept;
};

router.post('/register', validateRegister, async (req, res) => {
  const { email, password, role, departmentName } = req.body;
  
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    
    let deptId = null;
    if (departmentName) {
      const dept = await ensureDepartment(departmentName);
      deptId = dept.id;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'STUDENT',
        departmentId: deptId
      }
    });

    res.status(201).json({ message: "User registered successfully", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/login', validateLogin, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userData = { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId };
    if (user.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: user.departmentId } });
      userData.department = dept;
    }

    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get('/staff', verifyToken, async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'AUTHORITY'] }
      },
      select: {
        id: true,
        email: true,
        role: true,
        designation: true
      },
      orderBy: { designation: 'asc' }
    });
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

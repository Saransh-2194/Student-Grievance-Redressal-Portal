// Input validation helpers for complaint submission and other routes

const VALID_CATEGORIES = [
  'General Issues', 'Academics', 'Hostel', 'Mess & Canteen',
  'Housekeeping', 'Student Affairs', 'Medical', 'Personal'
];

const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_VISIBILITIES = ['PUBLIC', 'PERSONAL'];
const VALID_STATUSES = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED', 'ESCALATED'];
const VALID_VOTE_TYPES = ['UP', 'DOWN'];

export const validateComplaint = (req, res, next) => {
  const { title, description, category, severity, visibility } = req.body;

  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters.');
  }
  if (title && title.length > 200) {
    errors.push('Title must be 200 characters or fewer.');
  }
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters.');
  }
  if (description && description.length > 5000) {
    errors.push('Description must be 5000 characters or fewer.');
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    errors.push(`Severity must be one of: ${VALID_SEVERITIES.join(', ')}`);
  }
  if (!visibility || !VALID_VISIBILITIES.includes(visibility)) {
    errors.push(`Visibility must be one of: ${VALID_VISIBILITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  // Sanitize
  req.body.title = title.trim();
  req.body.description = description.trim();

  next();
};

export const validateVote = (req, res, next) => {
  const { type } = req.body;
  if (!type || !VALID_VOTE_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Vote type must be UP or DOWN.' });
  }
  next();
};

export const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  next();
};

export const validateRegister = (req, res, next) => {
  const { email, password, role } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    errors.push('Valid email is required.');
  }
  if (!password || typeof password !== 'string' || password.length < 4) {
    errors.push('Password must be at least 4 characters.');
  }
  if (role && !['STUDENT', 'ADMIN', 'AUTHORITY'].includes(role)) {
    errors.push('Role must be STUDENT, ADMIN, or AUTHORITY.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  next();
};

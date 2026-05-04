export const SLA_CONFIG = {
  LOW: 5 * 24 * 60 * 60 * 1000,      // 5 days
  MEDIUM: 3 * 24 * 60 * 60 * 1000,   // 3 days
  HIGH: 2 * 24 * 60 * 60 * 1000,     // 2 days
  CRITICAL: 1 * 24 * 60 * 60 * 1000, // 24 hours
};

export const calculateSlaDeadline = (severity, startTime = new Date()) => {
  const duration = SLA_CONFIG[severity] || SLA_CONFIG.LOW;
  return new Date(startTime.getTime() + duration);
};

export const isSlaBreached = (deadline) => {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
};

import { Status } from '@prisma/client';

export const VALID_TRANSITIONS = {
  [Status.CREATED]: [Status.ASSIGNED, Status.ESCALATED],
  [Status.ASSIGNED]: [Status.IN_PROGRESS, Status.RESOLVED, Status.ESCALATED],
  [Status.IN_PROGRESS]: [Status.UNDER_REVIEW, Status.RESOLVED, Status.ESCALATED],
  [Status.UNDER_REVIEW]: [Status.RESOLVED, Status.IN_PROGRESS, Status.ESCALATED],
  [Status.RESOLVED]: [Status.CLOSED, Status.IN_PROGRESS],
  [Status.CLOSED]: [],
  [Status.ESCALATED]: [Status.ASSIGNED, Status.IN_PROGRESS, Status.RESOLVED]
};

export const canTransition = (currentStatus, nextStatus) => {
  if (!VALID_TRANSITIONS[currentStatus]) return false;
  return VALID_TRANSITIONS[currentStatus].includes(nextStatus);
};

export const getWorkflowError = (current, next) => {
  return `Invalid transition from ${current} to ${next}. Workflow rules: ${VALID_TRANSITIONS[current].join(', ') || 'None'}`;
};

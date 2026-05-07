import prisma from './db.js';

/**
 * Multi-Tier Hierarchy Configuration
 * 
 * Each category maps to a chain of designations (in escalation order).
 * The Array-Index approach: currentChainIndex tracks position in this array.
 * Escalation = increment index, reassign to chain[newIndex].
 */

export const HIERARCHY_CHAINS = {
  'Hostel':                ['Warden', 'Chief Warden', 'Vice Chancellor'],
  'Housekeeping':          ['Caretaker', 'Chief Warden', 'Vice Chancellor'],
  'Mess & Canteen':        ['Mess Incharge', 'Registrar', 'Vice Chancellor'],
  'General Issues':        ['Registrar', 'Vice Chancellor'],
  'Personal':              ['Dean of Student Affairs', 'Vice Chancellor'],
  'Medical':               ['Chief Medical Officer', 'Vice Chancellor'],
  'Academics':             ['HOD', 'Dean of Academics', 'Vice Chancellor'],
  'Student Affairs':       ['Dean of Student Affairs', 'Registrar', 'Vice Chancellor'],
};

/**
 * Get the designation chain for a given category.
 * Falls back to a generic chain if category is unknown.
 */
export const getChainForCategory = (category) => {
  return HIERARCHY_CHAINS[category] || ['Registrar', 'Vice Chancellor'];
};

/**
 * Resolve a chain of designations to actual user IDs from the database.
 * Returns an array of user IDs in escalation order.
 * If a designation has no matching user, that slot is skipped.
 */
export const resolveChainToUserIds = async (designationChain, departmentId = null) => {
  const userIds = [];

  for (const designation of designationChain) {
    // Try to find a user with this designation in the specific department first
    let user = null;
    if (departmentId) {
      user = await prisma.user.findFirst({
        where: { designation, departmentId },
        select: { id: true }
      });
    }

    // Fallback: Find anyone with this designation (e.g. VC or global roles)
    if (!user) {
      user = await prisma.user.findFirst({
        where: { designation },
        select: { id: true }
      });
    }
    
    if (user) {
      userIds.push(user.id);
    } else {
      console.warn(`[Hierarchy] No user found for designation: ${designation}`);
      userIds.push(null);
    }
  }

  return userIds;
};

/**
 * Build and resolve the full chain for a ticket's category.
 * Returns { chain: string[], firstAuthority: string | null }
 */
export const buildChainForTicket = async (category, departmentId = null) => {
  const designations = getChainForCategory(category);
  const userIds = await resolveChainToUserIds(designations, departmentId);
  
  // Filter out null entries for a clean chain
  const cleanChain = userIds.filter(id => id !== null);
  
  return {
    chain: cleanChain,
    designations,
    firstAuthority: cleanChain.length > 0 ? cleanChain[0] : null
  };
};

/**
 * Get the next authority in the chain.
 * Returns the user ID at index+1, or null if at terminal.
 */
export const getNextInChain = (chain, currentIndex) => {
  const parsed = typeof chain === 'string' ? JSON.parse(chain) : chain;
  const nextIndex = currentIndex + 1;
  
  if (nextIndex >= parsed.length) return null;
  return parsed[nextIndex];
};

/**
 * Check if ticket is at the terminal authority (end of chain).
 */
export const isTerminal = (chain, currentIndex) => {
  const parsed = typeof chain === 'string' ? JSON.parse(chain) : chain;
  return currentIndex >= parsed.length - 1;
};

/**
 * Get full chain info with current position for UI rendering.
 * Returns an array of { userId, designation, email, isCurrent, isPast, isFuture }
 */
export const getChainWithPositions = async (escalationChain, currentIndex) => {
  const chain = typeof escalationChain === 'string' ? JSON.parse(escalationChain) : escalationChain;
  if (!chain || chain.length === 0) return [];

  const positions = [];

  for (let i = 0; i < chain.length; i++) {
    const user = await prisma.user.findUnique({
      where: { id: chain[i] },
      select: { id: true, email: true, designation: true, role: true }
    });

    positions.push({
      index: i,
      userId: chain[i],
      designation: user?.designation || `Authority Level ${i + 1}`,
      email: user?.email || 'Unknown',
      role: user?.role || 'ADMIN',
      isCurrent: i === currentIndex,
      isPast: i < currentIndex,
      isFuture: i > currentIndex
    });
  }

  return positions;
};

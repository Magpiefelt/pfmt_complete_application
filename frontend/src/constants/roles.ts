/**
 * Canonical Role System
 * Defines the standardized roles used throughout the PFMT application
 */

// Canonical roles enum
export const ROLES = {
  ADMIN: 'admin',
  PMI: 'pmi',
  DIRECTOR: 'director',
  PM: 'pm',
  SPM: 'spm',
  ANALYST: 'analyst',
  EXECUTIVE: 'executive',
  VENDOR: 'vendor'
} as const;

// Type for role values
export type Role = typeof ROLES[keyof typeof ROLES];

// Legacy role mapping for backward compatibility
export const LEGACY_ROLE_MAPPING: Record<string, Role> = {
  'project_manager': ROLES.PM,
  'senior_project_manager': ROLES.SPM,
  'project_initiator': ROLES.PMI,
  'contract_analyst': ROLES.ANALYST,
  'administrator': ROLES.ADMIN,
  'cfo': ROLES.EXECUTIVE
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.PMI]: 'Project Management & Infrastructure',
  [ROLES.DIRECTOR]: 'Director',
  [ROLES.PM]: 'Project Manager',
  [ROLES.SPM]: 'Senior Project Manager',
  [ROLES.ANALYST]: 'Contract Analyst',
  [ROLES.EXECUTIVE]: 'Executive',
  [ROLES.VENDOR]: 'Vendor'
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.ADMIN]: 'Full system access and user management',
  [ROLES.PMI]: 'Initiates new projects and manages infrastructure',
  [ROLES.DIRECTOR]: 'Assigns teams and oversees project portfolio',
  [ROLES.PM]: 'Manages assigned projects and deliverables',
  [ROLES.SPM]: 'Senior project management and strategic oversight',
  [ROLES.ANALYST]: 'Contract analysis and compliance review',
  [ROLES.EXECUTIVE]: 'Executive oversight and strategic decisions',
  [ROLES.VENDOR]: 'External vendor access and submissions'
};

// Role hierarchy levels (higher number = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.VENDOR]: 1,
  [ROLES.ANALYST]: 2,
  [ROLES.PMI]: 3,
  [ROLES.PM]: 4,
  [ROLES.SPM]: 5,
  [ROLES.EXECUTIVE]: 6,
  [ROLES.DIRECTOR]: 7,
  [ROLES.ADMIN]: 8
};

// Role groups for permission checking
export const ROLE_GROUPS = {
  PROJECT_MANAGERS: [ROLES.PM, ROLES.SPM],
  LEADERSHIP: [ROLES.DIRECTOR, ROLES.EXECUTIVE, ROLES.ADMIN],
  PROJECT_TEAM: [ROLES.PMI, ROLES.PM, ROLES.SPM],
  ALL_INTERNAL: [ROLES.ADMIN, ROLES.PMI, ROLES.DIRECTOR, ROLES.PM, ROLES.SPM, ROLES.ANALYST, ROLES.EXECUTIVE],
  ALL_ROLES: Object.values(ROLES)
} as const;

/**
 * Normalize a role to canonical format
 * @param role - Role to normalize
 * @returns Canonical role
 */
export function normalizeRole(role: string): Role {
  // If already canonical, return as-is
  if (Object.values(ROLES).includes(role as Role)) {
    return role as Role;
  }
  
  // Check legacy mapping
  const normalized = LEGACY_ROLE_MAPPING[role.toLowerCase()];
  if (normalized) {
    return normalized;
  }
  
  // Default fallback with warning
  console.warn(`Unknown role: ${role}, defaulting to 'pm'`);
  return ROLES.PM;
}

/**
 * Check if a role is valid
 * @param role - Role to validate
 * @returns True if role is valid
 */
export function isValidRole(role: string): boolean {
  return Object.values(ROLES).includes(role as Role) || 
         Object.keys(LEGACY_ROLE_MAPPING).includes(role.toLowerCase());
}

/**
 * Check if user has required role or higher
 * @param userRole - User's current role
 * @param requiredRole - Required role
 * @returns True if user has sufficient permissions
 */
export function hasRoleOrHigher(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user role is in a specific group
 * @param userRole - User's current role
 * @param group - Role group to check
 * @returns True if user role is in the group
 */
export function isInRoleGroup(userRole: Role, group: keyof typeof ROLE_GROUPS): boolean {
  return ROLE_GROUPS[group].includes(userRole);
}

/**
 * Get roles that can access a specific feature
 * @param feature - Feature name
 * @returns Array of roles that can access the feature
 */
export function getRolesForFeature(feature: string): Role[] {
  const featurePermissions: Record<string, Role[]> = {
    'project_initiation': [ROLES.PMI, ROLES.ADMIN],
    'team_assignment': [ROLES.DIRECTOR, ROLES.ADMIN],
    'project_finalization': [ROLES.PM, ROLES.SPM, ROLES.ADMIN],
    'project_view': ROLE_GROUPS.ALL_INTERNAL,
    'project_edit': [ROLES.PM, ROLES.SPM, ROLES.DIRECTOR, ROLES.ADMIN],
    'user_management': [ROLES.ADMIN],
    'reporting': [ROLES.ANALYST, ROLES.EXECUTIVE, ROLES.DIRECTOR, ROLES.ADMIN],
    'vendor_portal': [ROLES.VENDOR, ROLES.PM, ROLES.SPM, ROLES.ADMIN]
  };
  
  return featurePermissions[feature] || [];
}


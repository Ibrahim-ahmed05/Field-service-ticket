import { TicketStatus, UserRole } from "../types/field-service";

export interface TransitionRule {
  from: TicketStatus;
  to: TicketStatus;
  allowedRoles: UserRole[];
  description: string;
  requiresNotes?: boolean;
}

export const ALLOWED_TRANSITIONS: TransitionRule[] = [
  {
    from: "New",
    to: "Assigned",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Technician is chosen and job is assigned by manager.",
  },
  {
    from: "Assigned",
    to: "Rejected",
    allowedRoles: ["TECHNICIAN"],
    description: "Technician declines the job assignment.",
  },
  {
    from: "Rejected",
    to: "New",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Manager resets rejected ticket back to New for reassignment.",
  },
  {
    from: "Assigned",
    to: "In Progress",
    allowedRoles: ["TECHNICIAN"],
    description: "Technician starts work on site or remotely.",
  },
  {
    from: "In Progress",
    to: "Waiting",
    allowedRoles: ["TECHNICIAN"],
    description: "Work is paused waiting on parts or customer.",
  },
  {
    from: "Waiting",
    to: "In Progress",
    allowedRoles: ["TECHNICIAN"],
    description: "Work resumes.",
  },
  {
    from: "In Progress",
    to: "Resolved",
    allowedRoles: ["TECHNICIAN"],
    description: "Technician completes work and logs notes/evidence.",
    requiresNotes: true,
  },
  {
    from: "Resolved",
    to: "Closed",
    allowedRoles: ["MANAGER", "ADMIN", "CUSTOMER"],
    description: "Confirms the job is complete and finalizes ticket.",
  },
  {
    from: "Resolved",
    to: "In Progress",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Reopened by manager after customer dispute.",
  },
  // Cancellation transitions
  {
    from: "New",
    to: "Cancelled",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Ticket withdrawn before completion.",
  },
  {
    from: "Assigned",
    to: "Cancelled",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Ticket withdrawn before completion.",
  },
  {
    from: "In Progress",
    to: "Cancelled",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Ticket withdrawn before completion.",
  },
  {
    from: "Waiting",
    to: "Cancelled",
    allowedRoles: ["MANAGER", "ADMIN"],
    description: "Ticket withdrawn before completion.",
  },
];

export interface ValidationResult {
  valid: boolean;
  error?: {
    code: string;
    message: string;
    currentStatus: TicketStatus;
    requestedStatus: TicketStatus;
    allowedTransitions: { status: TicketStatus; roles: UserRole[]; note: string }[];
  };
}

export function validateStatusTransition(
  currentStatus: TicketStatus,
  targetStatus: TicketStatus,
  userRole: UserRole,
  isOverride = false,
): ValidationResult {
  // Final states are permanent unless emergency manager override
  if ((currentStatus === "Closed" || currentStatus === "Cancelled") && !isOverride) {
    return {
      valid: false,
      error: {
        code: "FINAL_STATE_VIOLATION",
        message: `Ticket is in final status "${currentStatus}" and cannot be transitioned further.`,
        currentStatus,
        requestedStatus: targetStatus,
        allowedTransitions: [],
      },
    };
  }

  // Manager emergency override allows exceptional status jumps
  if (isOverride && (userRole === "MANAGER" || userRole === "ADMIN")) {
    return { valid: true };
  }

  // Find matching transition
  const matchingRule = ALLOWED_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === targetStatus,
  );

  const allowedForCurrent = ALLOWED_TRANSITIONS.filter((t) => t.from === currentStatus).map(
    (t) => ({
      status: t.to,
      roles: t.allowedRoles,
      note: t.description,
    }),
  );

  if (!matchingRule) {
    return {
      valid: false,
      error: {
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot transition ticket from "${currentStatus}" to "${targetStatus}".`,
        currentStatus,
        requestedStatus: targetStatus,
        allowedTransitions: allowedForCurrent,
      },
    };
  }

  // Check role authorization for this specific transition
  if (!matchingRule.allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: {
        code: "UNAUTHORIZED_TRANSITION_ROLE",
        message: `Role "${userRole}" is not authorized to transition from "${currentStatus}" to "${targetStatus}". Allowed roles: ${matchingRule.allowedRoles.join(", ")}.`,
        currentStatus,
        requestedStatus: targetStatus,
        allowedTransitions: allowedForCurrent,
      },
    };
  }

  return { valid: true };
}

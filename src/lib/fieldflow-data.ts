export const BRAND = {
  name: "FieldFlow",
  tagline: "Field service operations, unified.",
};

export type UserRole = "manager" | "technician" | "customer";

export type TicketStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Waiting"
  | "Resolved"
  | "Closed"
  | "Cancelled"
  | "Rejected";

export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type Category =
  | "Solar"
  | "HVAC"
  | "Electrical"
  | "Industrial Equipment"
  | "Facility Maintenance"
  | "Other";

export type TechnicianStatus = "Available" | "On Site" | "Travelling" | "Off Duty";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyId: string;
};

export type Site = {
  id: string;
  customerId: string;
  name: string;
  address: string;
  siteType: string;
  companyId: string;
};

export type Equipment = {
  id: string;
  siteId: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  installDate: string;
};

export type Technician = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  skillSet: string[];
  specialization: string;
  active: boolean;
  status: TechnicianStatus;
  activeJobs: number;
  completedToday: number;
  region: string;
  rating: number;
  completionRate: number;
  companyId: string;
};

export type TicketHistory = {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
};

export type Attachment = {
  id: string;
  ticketId: string;
  name: string;
  uploadedBy: string;
  fileUrl: string;
  fileType: "image/jpeg" | "image/png" | "application/pdf";
  fileSize: string;
  uploadedAt: string;
  customerVisible: boolean;
  tone?: "before" | "issue" | "fix" | "after";
};

export type NotificationLog = {
  id: string;
  ticketId: string;
  channel: "Email" | "SMS" | "WhatsApp" | "DevLog";
  recipient: string;
  status: "Sent" | "Delivered" | "Logged";
  sentAt: string;
  triggerEvent:
    | "Ticket created"
    | "Technician assigned"
    | "Status changed to In Progress"
    | "Status changed to Resolved"
    | "Status changed to Closed"
    | "Ticket cancelled";
  messagePreview: string;
};

export type Note = {
  id: string;
  ticketId: string;
  author: string;
  authorRole: UserRole;
  time: string;
  body: string;
  internal: boolean;
};

export type Ticket = {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  siteAddress: string;
  equipmentId?: string;
  equipmentModel?: string;
  contact: { name: string; phone: string; email?: string };
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  assignedTechnicianId: string | null;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  workInstructions: string[];
  resolution?: string;
};

// Default SLA configuration per Architecture Doc (Section 8)
export const SLA_HOURS: Record<Priority, number> = {
  Urgent: 4, // 4 hours
  High: 24, // 1 day
  Medium: 72, // 3 days
  Low: 168, // 7 days
};

export const calculateDueDate = (createdAt: string, priority: Priority): string => {
  const created = new Date(createdAt);
  const hours = SLA_HOURS[priority] || 72;
  const due = new Date(created.getTime() + hours * 60 * 60 * 1000);
  return due.toISOString();
};

export const isTicketOverdue = (ticket: Ticket): boolean => {
  if (["Resolved", "Closed", "Cancelled", "Rejected"].includes(ticket.status)) {
    return false;
  }
  return new Date().getTime() > new Date(ticket.dueDate).getTime();
};

export const formatTimeRemaining = (dueDate: string, status: TicketStatus): string => {
  if (["Closed", "Resolved"].includes(status)) return "Completed within SLA";
  if (status === "Cancelled") return "Cancelled";
  if (status === "Rejected") return "Awaiting reassignment";

  const now = new Date().getTime();
  const due = new Date(dueDate).getTime();
  const diffMs = due - now;

  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
    return `Overdue by ${overdueHours}h ${overdueMinutes}m`;
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${minutes}m remaining`;
};

// Allowed State Transitions per Architecture Doc (Section 3)
export const ALLOWED_TRANSITIONS: {
  from: TicketStatus;
  to: TicketStatus;
  roles: UserRole[];
  description: string;
}[] = [
  { from: "New", to: "Assigned", roles: ["manager"], description: "Assign technician to new ticket" },
  { from: "Assigned", to: "Rejected", roles: ["technician"], description: "Technician declines assignment" },
  { from: "Rejected", to: "New", roles: ["manager"], description: "Sent back to New for reassignment" },
  { from: "Assigned", to: "In Progress", roles: ["technician"], description: "Technician starts work" },
  { from: "In Progress", to: "Waiting", roles: ["technician"], description: "Waiting on parts or customer access" },
  { from: "Waiting", to: "In Progress", roles: ["technician"], description: "Work resumed by technician" },
  { from: "In Progress", to: "Resolved", roles: ["technician"], description: "Technician completes work and logs evidence" },
  { from: "Resolved", to: "Closed", roles: ["manager", "customer"], description: "Confirms job is complete" },
  { from: "Resolved", to: "In Progress", roles: ["manager"], description: "Reopened after customer dispute" },
  { from: "New", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
  { from: "Assigned", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
  { from: "In Progress", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
  { from: "Waiting", to: "Cancelled", roles: ["manager"], description: "Manager withdraws ticket" },
];

export const getNextAllowedTransitions = (status: TicketStatus, role: UserRole) => {
  return ALLOWED_TRANSITIONS.filter((t) => t.from === status && t.roles.includes(role));
};

export const canTransition = (from: TicketStatus, to: TicketStatus, role: UserRole): { allowed: boolean; reason?: string } => {
  if (from === "Closed") return { allowed: false, reason: "Closed tickets are final and cannot be transitioned." };
  if (from === "Cancelled") return { allowed: false, reason: "Cancelled tickets are final and cannot be reopened." };

  const match = ALLOWED_TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!match) {
    const valid = ALLOWED_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to).join(", ") || "None";
    return { allowed: false, reason: `Invalid transition from "${from}" to "${to}". Allowed next statuses: ${valid}.` };
  }

  if (!match.roles.includes(role)) {
    return { allowed: false, reason: `Role "${role}" is not permitted to move ticket from "${from}" to "${to}". Allowed roles: ${match.roles.join(", ")}.` };
  }

  return { allowed: true };
};

// Initial Seed Data
export const initialCustomers: Customer[] = [
  { id: "c1", name: "Al Noor Commercial Complex", phone: "+92 21 3453 9080", email: "facilities@alnoor.pk", companyId: "comp-1" },
  { id: "c2", name: "Metro Business Centre", phone: "+92 21 3498 2210", email: "ops@metrobusiness.pk", companyId: "comp-1" },
  { id: "c3", name: "PakTech Manufacturing", phone: "+92 21 3505 7781", email: "engineering@paktech.pk", companyId: "comp-1" },
  { id: "c4", name: "GreenLine Textiles", phone: "+92 21 3225 4410", email: "maintenance@greenline.pk", companyId: "comp-1" },
  { id: "c5", name: "Sunrise Medical Centre", phone: "+92 21 3583 9902", email: "admin@sunrisemed.pk", companyId: "comp-1" },
  { id: "c6", name: "Crescent Foods Factory", phone: "+92 21 3472 1188", email: "plant@crescentfoods.pk", companyId: "comp-1" },
  { id: "c7", name: "Prime Logistics Warehouse", phone: "+92 21 3611 4420", email: "support@primelogistics.pk", companyId: "comp-1" },
  { id: "c8", name: "Atlas Packaging", phone: "+92 21 3501 2244", email: "tech@atlaspack.pk", companyId: "comp-1" },
];

export const initialSites: Site[] = [
  { id: "s1", customerId: "c1", name: "Building B – Rooftop Solar Facility", address: "Shahrah-e-Faisal, Karachi", siteType: "Commercial Rooftop", companyId: "comp-1" },
  { id: "s2", customerId: "c1", name: "Server Room – Ground Floor", address: "Shahrah-e-Faisal, Karachi", siteType: "Data Infrastructure", companyId: "comp-1" },
  { id: "s3", customerId: "c2", name: "Tower A – Chiller Plant", address: "Gulshan-e-Iqbal, Karachi", siteType: "HVAC Facility", companyId: "comp-1" },
  { id: "s4", customerId: "c2", name: "Tower B – Plant Room", address: "Gulshan-e-Iqbal, Karachi", siteType: "HVAC Utility", companyId: "comp-1" },
  { id: "s5", customerId: "c3", name: "Plant 2 – Utilities Block", address: "Korangi Industrial Area, Karachi", siteType: "Heavy Industrial", companyId: "comp-1" },
  { id: "s6", customerId: "c3", name: "Plant 1 – Compressor House", address: "Korangi Industrial Area, Karachi", siteType: "Pneumatic Plant", companyId: "comp-1" },
  { id: "s7", customerId: "c4", name: "Unit 1 – Main Distribution Room", address: "S.I.T.E. Area, Karachi", siteType: "Substation", companyId: "comp-1" },
  { id: "s8", customerId: "c4", name: "Unit 2 – Power Room", address: "S.I.T.E. Area, Karachi", siteType: "Power Distribution", companyId: "comp-1" },
  { id: "s9", customerId: "c5", name: "Block C – Plant Room", address: "Clifton, Karachi", siteType: "Hospital Critical Care", companyId: "comp-1" },
  { id: "s10", customerId: "c5", name: "Generator Room", address: "Clifton, Karachi", siteType: "Emergency Power", companyId: "comp-1" },
  { id: "s11", customerId: "c6", name: "Warehouse Roof Array", address: "Port Qasim, Karachi", siteType: "Industrial Solar", companyId: "comp-1" },
  { id: "s12", customerId: "c6", name: "Cold Store 2", address: "Port Qasim, Karachi", siteType: "Cold Storage Facility", companyId: "comp-1" },
  { id: "s13", customerId: "c7", name: "Aisle 4 – DB West", address: "Super Highway, Karachi", siteType: "Logistics Warehouse", companyId: "comp-1" },
  { id: "s14", customerId: "c8", name: "Line 3 – MCC Room", address: "Landhi, Karachi", siteType: "Production Line", companyId: "comp-1" },
];

export const initialEquipment: Equipment[] = [
  { id: "eq1", siteId: "s1", equipmentType: "Solar Inverter", model: "Sungrow SG110CX", serialNumber: "SN-SGR-2024-8841", installDate: "2024-03-15" },
  { id: "eq2", siteId: "s2", equipmentType: "Online UPS", model: "Schneider Galaxy VS 40kVA", serialNumber: "SN-SCH-2023-1192", installDate: "2023-08-20" },
  { id: "eq3", siteId: "s3", equipmentType: "Centrifugal Chiller", model: "Trane CVHE 500-Ton", serialNumber: "SN-TRN-2022-7744", installDate: "2022-11-10" },
  { id: "eq4", siteId: "s5", equipmentType: "Industrial Booster Pump", model: "Grundfos CRN 64-3", serialNumber: "SN-GRN-2023-9901", installDate: "2023-05-18" },
  { id: "eq5", siteId: "s7", equipmentType: "Low Voltage Switchgear", model: "ABB MNS 3.0", serialNumber: "SN-ABB-2021-4451", installDate: "2021-09-01" },
  { id: "eq6", siteId: "s10", equipmentType: "Standby Diesel Generator", model: "Cummins C550 D5e", serialNumber: "SN-CUM-2023-0042", installDate: "2023-01-25" },
  { id: "eq7", siteId: "s14", equipmentType: "Motor Control Center", model: "Siemens Sivacon S8", serialNumber: "SN-SIE-2024-3329", installDate: "2024-02-12" },
];

export const initialTechnicians: Technician[] = [
  {
    id: "t1",
    name: "Ahmed Raza",
    initials: "AR",
    phone: "+92 300 214 8890",
    email: "ahmed.raza@fieldflow.io",
    skillSet: ["Solar", "High Voltage", "Inverters", "Grid Tie"],
    specialization: "Solar / Electrical",
    active: true,
    status: "On Site",
    activeJobs: 3,
    completedToday: 2,
    region: "Karachi South",
    rating: 4.9,
    completionRate: 96,
    companyId: "comp-1",
  },
  {
    id: "t2",
    name: "Usman Tariq",
    initials: "UT",
    phone: "+92 301 447 2210",
    email: "usman.tariq@fieldflow.io",
    skillSet: ["Chillers", "VRF Systems", "Pneumatics", "AHU Maintenance"],
    specialization: "HVAC",
    active: true,
    status: "Travelling",
    activeJobs: 2,
    completedToday: 1,
    region: "Karachi East",
    rating: 4.7,
    completionRate: 92,
    companyId: "comp-1",
  },
  {
    id: "t3",
    name: "Bilal Khan",
    initials: "BK",
    phone: "+92 333 908 1123",
    email: "bilal.khan@fieldflow.io",
    skillSet: ["Pumps", "Compressors", "Hydraulics", "Sensors"],
    specialization: "Industrial Equipment",
    active: true,
    status: "Available",
    activeJobs: 2,
    completedToday: 2,
    region: "Port Qasim",
    rating: 4.8,
    completionRate: 94,
    companyId: "comp-1",
  },
  {
    id: "t4",
    name: "Sara Ahmed",
    initials: "SA",
    phone: "+92 345 771 6654",
    email: "sara.ahmed@fieldflow.io",
    skillSet: ["Switchboards", "Protection Relays", "UPS Systems", "Transformers"],
    specialization: "Electrical / Facilities",
    active: true,
    status: "On Site",
    activeJobs: 3,
    completedToday: 3,
    region: "Karachi Central",
    rating: 4.9,
    completionRate: 98,
    companyId: "comp-1",
  },
  {
    id: "t5",
    name: "Hassan Javed",
    initials: "HJ",
    phone: "+92 322 556 1190",
    email: "hassan.javed@fieldflow.io",
    skillSet: ["Solar", "Facilities", "HVAC Diagnostics"],
    specialization: "Solar / Facilities",
    active: true,
    status: "Off Duty",
    activeJobs: 1,
    completedToday: 0,
    region: "Hyderabad",
    rating: 4.6,
    completionRate: 90,
    companyId: "comp-1",
  },
];

export const initialTickets: Ticket[] = [
  {
    id: "TKT-2048",
    companyId: "comp-1",
    customerId: "c1",
    customerName: "Al Noor Commercial Complex",
    siteId: "s1",
    siteName: "Building B – Rooftop Solar Facility",
    siteAddress: "Shahrah-e-Faisal, Karachi",
    equipmentId: "eq1",
    equipmentModel: "Sungrow SG110CX",
    contact: { name: "Muhammad Hamza", phone: "+92 21 3453 9080", email: "hamza@alnoor.pk" },
    title: "Solar inverter producing low output",
    description: "Solar generation dropped approximately 35% compared with expected production since yesterday afternoon. Site team reports intermittent inverter fault codes during peak irradiance.",
    category: "Solar",
    priority: "High",
    status: "In Progress",
    assignedTechnicianId: "t1",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    workInstructions: [
      "Verify DC string voltages against baseline readings",
      "Inspect combiner box connectors for heat damage",
      "Log inverter fault history before reset",
    ],
  },
  {
    id: "TKT-2051",
    companyId: "comp-1",
    customerId: "c2",
    customerName: "Metro Business Centre",
    siteId: "s3",
    siteName: "Tower A – Chiller Plant",
    siteAddress: "Gulshan-e-Iqbal, Karachi",
    equipmentId: "eq3",
    equipmentModel: "Trane CVHE 500-Ton",
    contact: { name: "Farhan Siddiqui", phone: "+92 21 3498 2210", email: "farhan@metrobusiness.pk" },
    title: "HVAC central chiller not cooling floors 3-5",
    description: "Central cooling for floors 3–5 is not reaching setpoint. Occupants reporting warm air from supply vents since 8 AM.",
    category: "HVAC",
    priority: "Urgent",
    status: "Assigned",
    assignedTechnicianId: "t2",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString(),
    workInstructions: [
      "Check refrigerant pressures and compressor status",
      "Confirm chilled water loop temperatures and flow rates",
    ],
  },
  {
    id: "TKT-2053",
    companyId: "comp-1",
    customerId: "c3",
    customerName: "PakTech Manufacturing",
    siteId: "s5",
    siteName: "Plant 2 – Utilities Block",
    siteAddress: "Korangi Industrial Area, Karachi",
    equipmentId: "eq4",
    equipmentModel: "Grundfos CRN 64-3",
    contact: { name: "Imran Sheikh", phone: "+92 21 3505 7781", email: "imran@paktech.pk" },
    title: "Process pump pressure fluctuation on main line",
    description: "Process pump 4 shows pressure swings of ±1.8 bar during production runs, tripping the downstream sensor alarm.",
    category: "Industrial Equipment",
    priority: "Medium",
    status: "Waiting",
    assignedTechnicianId: "t3",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 62 * 60 * 60 * 1000).toISOString(),
    workInstructions: ["Record pressure trend across full cycle", "Inspect suction strainer and check valves"],
  },
  {
    id: "TKT-2054",
    companyId: "comp-1",
    customerId: "c4",
    customerName: "GreenLine Textiles",
    siteId: "s7",
    siteName: "Unit 1 – Main Distribution Room",
    siteAddress: "S.I.T.E. Area, Karachi",
    equipmentId: "eq5",
    equipmentModel: "ABB MNS 3.0",
    contact: { name: "Nadia Aslam", phone: "+92 21 3225 4410", email: "nadia@greenline.pk" },
    title: "Electrical distribution panel DB-3 overheating",
    description: "Thermal imaging shows a hotspot of 78°C on the main incomer busbar of DB-3. Needs emergency inspection.",
    category: "Electrical",
    priority: "Urgent",
    status: "New",
    assignedTechnicianId: null,
    createdBy: "Customer Portal (Nadia Aslam)",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 3.4 * 60 * 60 * 1000).toISOString(),
    workInstructions: ["De-energize DB-3 safely", "Torque check all busbar bolts", "Thermal re-scan"],
  },
  {
    id: "TKT-2031",
    companyId: "comp-1",
    customerId: "c8",
    customerName: "Atlas Packaging",
    siteId: "s14",
    siteName: "Line 3 – MCC Room",
    siteAddress: "Landhi, Karachi",
    equipmentId: "eq7",
    equipmentModel: "Siemens Sivacon S8",
    contact: { name: "Kamran Rauf", phone: "+92 21 3501 2244", email: "kamran@atlaspack.pk" },
    title: "Motor control panel alarm on conveyor drive",
    description: "MCC panel 2 raising repeated overload alarms on conveyor drive during startup.",
    category: "Industrial Equipment",
    priority: "High",
    status: "In Progress",
    assignedTechnicianId: "t4",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // OVERDUE
    workInstructions: ["Check overload relay settings", "Inspect drive cabling for insulation breakdown"],
  },
  {
    id: "TKT-2042",
    companyId: "comp-1",
    customerId: "c5",
    customerName: "Sunrise Medical Centre",
    siteId: "s9",
    siteName: "Block C – Plant Room",
    siteAddress: "Clifton, Karachi",
    contact: { name: "Dr. Zainab Ali", phone: "+92 21 3583 9902", email: "zainab@sunrisemed.pk" },
    title: "Air handling unit vibration and noise",
    description: "AHU-2 producing abnormal vibration and acoustic noise at high fan speed.",
    category: "HVAC",
    priority: "High",
    status: "Waiting",
    assignedTechnicianId: "t2",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    workInstructions: ["Replace bearing set once part arrives from supplier"],
  },
  {
    id: "TKT-2024",
    companyId: "comp-1",
    customerId: "c5",
    customerName: "Sunrise Medical Centre",
    siteId: "s10",
    siteName: "Generator Room",
    siteAddress: "Clifton, Karachi",
    equipmentId: "eq6",
    equipmentModel: "Cummins C550 D5e",
    contact: { name: "Dr. Zainab Ali", phone: "+92 21 3583 9902", email: "zainab@sunrisemed.pk" },
    title: "Generator standby auto-start test failed",
    description: "Standby generator failed weekly auto-start test; starter battery voltage measured low.",
    category: "Electrical",
    priority: "Urgent",
    status: "Resolved",
    assignedTechnicianId: "t4",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    workInstructions: ["Replace starter battery bank", "Execute 3-phase auto transfer test"],
    resolution: "Starter battery bank replaced with heavy-duty 24V unit. Auto-start and transfer tested successfully 3 times.",
  },
  {
    id: "TKT-2015",
    companyId: "comp-1",
    customerId: "c7",
    customerName: "Prime Logistics Warehouse",
    siteId: "s13",
    siteName: "Aisle 4 – DB West",
    siteAddress: "Super Highway, Karachi",
    contact: { name: "Adeel Munir", phone: "+92 21 3611 4420", email: "adeel@primelogistics.pk" },
    title: "Warehouse aisle lighting circuit breaker tripping",
    description: "Warehouse aisle lighting circuit trips intermittently under load.",
    category: "Electrical",
    priority: "Medium",
    status: "Rejected",
    assignedTechnicianId: "t4",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    workInstructions: ["Scope inspection"],
  },
  {
    id: "TKT-2012",
    companyId: "comp-1",
    customerId: "c2",
    customerName: "Metro Business Centre",
    siteId: "s4",
    siteName: "Tower B – Plant Room",
    siteAddress: "Gulshan-e-Iqbal, Karachi",
    contact: { name: "Farhan Siddiqui", phone: "+92 21 3498 2210", email: "farhan@metrobusiness.pk" },
    title: "Chiller pump flange gasket seepage",
    description: "Minor leak observed at chiller pump flange gasket during routine walk-around.",
    category: "HVAC",
    priority: "Low",
    status: "Cancelled",
    assignedTechnicianId: null,
    createdBy: "Farhan Siddiqui (Customer)",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
    workInstructions: [],
  },
  {
    id: "TKT-2001",
    companyId: "comp-1",
    customerId: "c4",
    customerName: "GreenLine Textiles",
    siteId: "s8",
    siteName: "Unit 2 – Power Room",
    siteAddress: "S.I.T.E. Area, Karachi",
    contact: { name: "Nadia Aslam", phone: "+92 21 3225 4410", email: "nadia@greenline.pk" },
    title: "Voltage stabiliser tripping on grid switchover",
    description: "Stabiliser tripping on high transient input voltage during grid switchover.",
    category: "Electrical",
    priority: "Medium",
    status: "Closed",
    assignedTechnicianId: "t4",
    createdBy: "Alex Morgan (Manager)",
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    workInstructions: ["Replace surge protection varistors", "Calibrate trip thresholds"],
    resolution: "Input surge protection module replaced and grid switchover simulated cleanly under full plant load.",
  },
];

export const initialHistory: TicketHistory[] = [
  {
    id: "h1",
    ticketId: "TKT-2048",
    fromStatus: null,
    toStatus: "New",
    changedBy: "Alex Morgan (Manager)",
    changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    note: "Ticket created after customer call regarding solar degradation.",
  },
  {
    id: "h2",
    ticketId: "TKT-2048",
    fromStatus: "New",
    toStatus: "Assigned",
    changedBy: "Alex Morgan (Manager)",
    changedAt: new Date(Date.now() - 3.8 * 60 * 60 * 1000).toISOString(),
    note: "Assigned to Ahmed Raza based on Solar PV specialization.",
  },
  {
    id: "h3",
    ticketId: "TKT-2048",
    fromStatus: "Assigned",
    toStatus: "In Progress",
    changedBy: "Ahmed Raza (Technician)",
    changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    note: "Arrived on site. Commencing string 3 voltage and thermal diagnostics.",
  },
  {
    id: "h4",
    ticketId: "TKT-2024",
    fromStatus: null,
    toStatus: "New",
    changedBy: "Alex Morgan",
    changedAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    note: "Ticket created from weekly facility audit report.",
  },
  {
    id: "h5",
    ticketId: "TKT-2024",
    fromStatus: "New",
    toStatus: "Assigned",
    changedBy: "Alex Morgan",
    changedAt: new Date(Date.now() - 27.5 * 60 * 60 * 1000).toISOString(),
    note: "Assigned to Sara Ahmed.",
  },
  {
    id: "h6",
    ticketId: "TKT-2024",
    fromStatus: "Assigned",
    toStatus: "In Progress",
    changedBy: "Sara Ahmed",
    changedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    note: "Work started on starter battery replacement.",
  },
  {
    id: "h7",
    ticketId: "TKT-2024",
    fromStatus: "In Progress",
    toStatus: "Resolved",
    changedBy: "Sara Ahmed",
    changedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    note: "Completed replacement and logged photos. Awaiting manager/customer confirmation.",
  },
  {
    id: "h8",
    ticketId: "TKT-2015",
    fromStatus: "Assigned",
    toStatus: "Rejected",
    changedBy: "Sara Ahmed (Technician)",
    changedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
    note: "Out of contracted scope — requires certified high-bay lift contractor.",
  },
];

export const initialNotes: Note[] = [
  {
    id: "n1",
    ticketId: "TKT-2048",
    author: "Ahmed Raza",
    authorRole: "technician",
    time: "2 hours ago",
    body: "DC String 3 is measuring 280V open-circuit compared to 540V on Strings 1 & 2. Suspect degraded MC4 connector.",
    internal: true,
  },
  {
    id: "n2",
    ticketId: "TKT-2048",
    author: "Ahmed Raza",
    authorRole: "technician",
    time: "1 hour ago",
    body: "Technician is on site and actively diagnosing the inverter string fault. Expected resolution within 2 hours.",
    internal: false,
  },
  {
    id: "n3",
    ticketId: "TKT-2051",
    author: "Alex Morgan",
    authorRole: "manager",
    time: "2 hours ago",
    body: "Customer requested expedited service as boardroom events are scheduled this afternoon.",
    internal: true,
  },
];

export const initialAttachments: Attachment[] = [
  {
    id: "att1",
    ticketId: "TKT-2048",
    name: "inverter_error_code_log.png",
    uploadedBy: "Ahmed Raza",
    fileUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80",
    fileType: "image/png",
    fileSize: "1.4 MB",
    uploadedAt: "Today, 10:46 AM",
    customerVisible: true,
    tone: "issue",
  },
  {
    id: "att2",
    ticketId: "TKT-2048",
    name: "connector_thermal_scan.png",
    uploadedBy: "Ahmed Raza",
    fileUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
    fileType: "image/png",
    fileSize: "2.1 MB",
    uploadedAt: "Today, 11:22 AM",
    customerVisible: false,
    tone: "before",
  },
  {
    id: "att3",
    ticketId: "TKT-2024",
    name: "battery_test_certificate.pdf",
    uploadedBy: "Sara Ahmed",
    fileUrl: "#",
    fileType: "application/pdf",
    fileSize: "420 KB",
    uploadedAt: "Yesterday, 12:10 PM",
    customerVisible: true,
    tone: "after",
  },
];

export const initialNotificationLogs: NotificationLog[] = [
  {
    id: "notif1",
    ticketId: "TKT-2048",
    channel: "WhatsApp",
    recipient: "+92 21 3453 9080 (Muhammad Hamza)",
    status: "Delivered",
    sentAt: "Today, 09:16 AM",
    triggerEvent: "Ticket created",
    messagePreview: "FieldFlow: Ticket #TKT-2048 'Solar inverter producing low output' logged. Priority: High.",
  },
  {
    id: "notif2",
    ticketId: "TKT-2048",
    channel: "SMS",
    recipient: "+92 300 214 8890 (Ahmed Raza)",
    status: "Delivered",
    sentAt: "Today, 09:25 AM",
    triggerEvent: "Technician assigned",
    messagePreview: "FieldFlow Dispatch: You have been assigned to Ticket #TKT-2048 at Al Noor Commercial Complex.",
  },
  {
    id: "notif3",
    ticketId: "TKT-2048",
    channel: "Email",
    recipient: "facilities@alnoor.pk",
    status: "Sent",
    sentAt: "Today, 11:10 AM",
    triggerEvent: "Status changed to In Progress",
    messagePreview: "FieldFlow Update: Technician Ahmed Raza has commenced on-site work on Ticket #TKT-2048.",
  },
  {
    id: "notif4",
    ticketId: "TKT-2024",
    channel: "Email",
    recipient: "admin@sunrisemed.pk",
    status: "Sent",
    sentAt: "Yesterday, 12:15 PM",
    triggerEvent: "Status changed to Resolved",
    messagePreview: "FieldFlow: Ticket #TKT-2024 has been marked Resolved. Please confirm resolution via customer link.",
  },
];

export const allTicketStatuses: TicketStatus[] = [
  "New",
  "Assigned",
  "In Progress",
  "Waiting",
  "Resolved",
  "Closed",
  "Cancelled",
  "Rejected",
];

export const allPriorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

export const allCategories: Category[] = [
  "Solar",
  "HVAC",
  "Electrical",
  "Industrial Equipment",
  "Facility Maintenance",
  "Other",
];

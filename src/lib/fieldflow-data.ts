export const BRAND = {
  name: "FieldFlow",
  tagline: "Field service operations, unified.",
};

export type TicketStatus =
  | "New"
  | "Assigned"
  | "Travelling"
  | "On Site"
  | "In Progress"
  | "Waiting for Customer"
  | "On Hold"
  | "Completed"
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

export type TechnicianStatus = "On Site" | "Travelling" | "Available" | "Off Duty";

export type Technician = {
  id: string;
  name: string;
  initials: string;
  specialization: string;
  status: TechnicianStatus;
  activeJobs: number;
  completedToday: number;
  phone: string;
  region: string;
  rating: number;
  completionRate: number;
};

export type TimelineEvent = {
  time: string;
  label: string;
  actor: string;
  description?: string;
  customerSafe: boolean;
};

export type Note = {
  id: string;
  author: string;
  time: string;
  body: string;
  internal: boolean;
};

export type Evidence = {
  id: string;
  label: string;
  time: string;
  tone: "before" | "issue" | "fix" | "after";
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  customer: string;
  site: string;
  location: string;
  contact: { name: string; phone: string };
  category: Category;
  priority: Priority;
  status: TicketStatus;
  technicianId: string | null;
  created: string;
  createdLabel: string;
  slaHours: number;
  slaRemaining: string;
  overdue: boolean;
  scheduled: string;
  workInstructions: string[];
  timeline: TimelineEvent[];
  notes: Note[];
  evidence: Evidence[];
  resolution?: string;
  history: { date: string; summary: string }[];
};

export const technicians: Technician[] = [
  {
    id: "t1",
    name: "Ahmed Raza",
    initials: "AR",
    specialization: "Solar / Electrical",
    status: "On Site",
    activeJobs: 5,
    completedToday: 2,
    phone: "+92 300 214 8890",
    region: "Karachi South",
    rating: 4.9,
    completionRate: 96,
  },
  {
    id: "t2",
    name: "Usman Tariq",
    initials: "UT",
    specialization: "HVAC",
    status: "Travelling",
    activeJobs: 4,
    completedToday: 1,
    phone: "+92 301 447 2210",
    region: "Karachi East",
    rating: 4.7,
    completionRate: 92,
  },
  {
    id: "t3",
    name: "Bilal Khan",
    initials: "BK",
    specialization: "Industrial Equipment",
    status: "Available",
    activeJobs: 3,
    completedToday: 2,
    phone: "+92 333 908 1123",
    region: "Port Qasim",
    rating: 4.8,
    completionRate: 94,
  },
  {
    id: "t4",
    name: "Sara Ahmed",
    initials: "SA",
    specialization: "Electrical / Facilities",
    status: "On Site",
    activeJobs: 4,
    completedToday: 3,
    phone: "+92 345 771 6654",
    region: "Karachi Central",
    rating: 4.9,
    completionRate: 98,
  },
  {
    id: "t5",
    name: "Hassan Javed",
    initials: "HJ",
    specialization: "Solar / Facilities",
    status: "Off Duty",
    activeJobs: 0,
    completedToday: 0,
    phone: "+92 322 556 1190",
    region: "Hyderabad",
    rating: 4.6,
    completionRate: 90,
  },
];

export const technicianById = (id: string | null) =>
  technicians.find((t) => t.id === id) ?? null;

const baseNotes = (author: string): Note[] => [
  {
    id: "n1",
    author,
    time: "10:52 AM",
    body: "Input voltage checked. Inverter showing abnormal DC input fluctuation on String 3.",
    internal: true,
  },
  {
    id: "n2",
    author,
    time: "11:15 AM",
    body: "Technician is on site and actively diagnosing the issue.",
    internal: false,
  },
];

export const tickets: Ticket[] = [
  {
    id: "TKT-2048",
    title: "Solar inverter producing low output",
    description:
      "Solar generation dropped approximately 35% compared with expected production since yesterday afternoon. Site team reports intermittent inverter fault codes during peak hours.",
    customer: "Al Noor Commercial Complex",
    site: "Building B – Rooftop Solar Facility",
    location: "Shahrah-e-Faisal, Karachi",
    contact: { name: "Muhammad Hamza", phone: "+92 21 3453 9080" },
    category: "Solar",
    priority: "High",
    status: "In Progress",
    technicianId: "t1",
    created: "2026-09-09T09:15:00",
    createdLabel: "Today, 09:15 AM",
    slaHours: 8,
    slaRemaining: "4h 20m left",
    overdue: false,
    scheduled: "Today, 10:00 AM",
    workInstructions: [
      "Verify DC string voltages against baseline readings",
      "Inspect combiner box connectors for heat damage",
      "Log inverter fault history before reset",
    ],
    timeline: [
      { time: "09:15 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true, description: "Reported by site facility team." },
      { time: "09:24 AM", label: "Ahmed Raza assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "10:02 AM", label: "Technician travelling", actor: "Ahmed Raza", customerSafe: true },
      { time: "10:41 AM", label: "Technician arrived on site", actor: "Ahmed Raza", customerSafe: true },
      { time: "11:10 AM", label: "Work started", actor: "Ahmed Raza", customerSafe: true, description: "String-level diagnostics in progress." },
    ],
    notes: baseNotes("Ahmed Raza"),
    evidence: [
      { id: "e1", label: "Before inspection", time: "10:46 AM", tone: "before" },
      { id: "e2", label: "Damaged connector", time: "11:22 AM", tone: "issue" },
    ],
    history: [
      { date: "12 Jun 2026", summary: "Quarterly panel cleaning and string test — passed." },
      { date: "03 Mar 2026", summary: "Inverter firmware updated to v2.14." },
    ],
  },
  {
    id: "TKT-2051",
    title: "HVAC unit not cooling",
    description:
      "Central cooling for floors 3–5 is not reaching setpoint. Occupants reporting warm air from supply vents since morning.",
    customer: "Metro Business Centre",
    site: "Tower A – Chiller Plant",
    location: "Gulshan-e-Iqbal, Karachi",
    contact: { name: "Farhan Siddiqui", phone: "+92 21 3498 2210" },
    category: "HVAC",
    priority: "Urgent",
    status: "Assigned",
    technicianId: "t2",
    created: "2026-09-09T08:40:00",
    createdLabel: "Today, 08:40 AM",
    slaHours: 4,
    slaRemaining: "1h 05m left",
    overdue: false,
    scheduled: "Today, 10:30 AM",
    workInstructions: [
      "Check refrigerant pressures and compressor status",
      "Confirm chilled water loop temperatures",
    ],
    timeline: [
      { time: "08:40 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "08:55 AM", label: "Usman Tariq assigned", actor: "Alex Morgan", customerSafe: true },
    ],
    notes: [
      { id: "n1", author: "Alex Morgan", time: "08:52 AM", body: "Escalated by building management — meeting floors affected.", internal: true },
    ],
    evidence: [],
    history: [{ date: "18 Jul 2026", summary: "Condenser coil cleaning completed." }],
  },
  {
    id: "TKT-2053",
    title: "Industrial pump pressure fluctuation",
    description:
      "Process pump 4 shows pressure swings of ±1.8 bar during production runs, tripping the downstream sensor alarm.",
    customer: "PakTech Manufacturing",
    site: "Plant 2 – Utilities Block",
    location: "Korangi Industrial Area, Karachi",
    contact: { name: "Imran Sheikh", phone: "+92 21 3505 7781" },
    category: "Industrial Equipment",
    priority: "Medium",
    status: "On Site",
    technicianId: "t3",
    created: "2026-09-09T07:55:00",
    createdLabel: "Today, 07:55 AM",
    slaHours: 12,
    slaRemaining: "7h 40m left",
    overdue: false,
    scheduled: "Today, 09:30 AM",
    workInstructions: ["Record pressure trend across full cycle", "Inspect suction strainer"],
    timeline: [
      { time: "07:55 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "08:20 AM", label: "Bilal Khan assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "09:26 AM", label: "Technician arrived on site", actor: "Bilal Khan", customerSafe: true },
    ],
    notes: [],
    evidence: [{ id: "e1", label: "Before inspection", time: "09:31 AM", tone: "before" }],
    history: [],
  },
  {
    id: "TKT-2054",
    title: "Electrical distribution panel overheating",
    description: "Thermal imaging shows a hotspot of 78°C on the main incomer busbar of DB-3.",
    customer: "GreenLine Textiles",
    site: "Unit 1 – Main Distribution Room",
    location: "S.I.T.E. Area, Karachi",
    contact: { name: "Nadia Aslam", phone: "+92 21 3225 4410" },
    category: "Electrical",
    priority: "Urgent",
    status: "New",
    technicianId: null,
    created: "2026-09-09T09:48:00",
    createdLabel: "Today, 09:48 AM",
    slaHours: 4,
    slaRemaining: "Unassigned",
    overdue: false,
    scheduled: "Unscheduled",
    workInstructions: [],
    timeline: [{ time: "09:48 AM", label: "Ticket created", actor: "Customer portal", customerSafe: true }],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2042",
    title: "Air handling unit vibration",
    description: "AHU-2 producing abnormal vibration and noise at high fan speed.",
    customer: "Sunrise Medical Centre",
    site: "Block C – Plant Room",
    location: "Clifton, Karachi",
    contact: { name: "Dr. Zainab Ali", phone: "+92 21 3583 9902" },
    category: "HVAC",
    priority: "High",
    status: "On Hold",
    technicianId: "t2",
    created: "2026-09-08T14:20:00",
    createdLabel: "Yesterday, 02:20 PM",
    slaHours: 24,
    slaRemaining: "Paused — awaiting part",
    overdue: false,
    scheduled: "Tomorrow, 11:00 AM",
    workInstructions: ["Replace bearing set once part arrives"],
    timeline: [
      { time: "02:20 PM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "03:10 PM", label: "Usman Tariq assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "05:02 PM", label: "Placed on hold", actor: "Usman Tariq", customerSafe: true, description: "Replacement bearing on order." },
    ],
    notes: [{ id: "n1", author: "Usman Tariq", time: "05:04 PM", body: "Bearing SKF-6206 ordered, ETA 2 days.", internal: true }],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2039",
    title: "Solar panel string fault",
    description: "String 7 offline after overnight storm; suspected connector water ingress.",
    customer: "Crescent Foods Factory",
    site: "Warehouse Roof Array",
    location: "Port Qasim, Karachi",
    contact: { name: "Salman Yousuf", phone: "+92 21 3472 1188" },
    category: "Solar",
    priority: "High",
    status: "Travelling",
    technicianId: "t1",
    created: "2026-09-09T08:05:00",
    createdLabel: "Today, 08:05 AM",
    slaHours: 8,
    slaRemaining: "3h 15m left",
    overdue: false,
    scheduled: "Today, 12:30 PM",
    workInstructions: ["Megger test string 7", "Reseal junction boxes"],
    timeline: [
      { time: "08:05 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "08:30 AM", label: "Ahmed Raza assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "11:58 AM", label: "Technician travelling", actor: "Ahmed Raza", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2031",
    title: "Motor control panel alarm",
    description: "MCC panel 2 raising repeated overload alarms on conveyor drive.",
    customer: "Atlas Packaging",
    site: "Line 3 – MCC Room",
    location: "Landhi, Karachi",
    contact: { name: "Kamran Rauf", phone: "+92 21 3501 2244" },
    category: "Industrial Equipment",
    priority: "High",
    status: "In Progress",
    technicianId: "t4",
    created: "2026-09-09T07:10:00",
    createdLabel: "Today, 07:10 AM",
    slaHours: 6,
    slaRemaining: "Overdue by 1h 10m",
    overdue: true,
    scheduled: "Today, 08:00 AM",
    workInstructions: ["Check overload relay settings", "Inspect drive cabling"],
    timeline: [
      { time: "07:10 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "07:35 AM", label: "Sara Ahmed assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "08:44 AM", label: "Work started", actor: "Sara Ahmed", customerSafe: true },
    ],
    notes: [{ id: "n1", author: "Sara Ahmed", time: "09:30 AM", body: "Overload relay drifting — likely replacement required.", internal: true }],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2028",
    title: "Cooling tower inspection",
    description: "Scheduled quarterly inspection of cooling tower fill and drift eliminators.",
    customer: "Prime Logistics Warehouse",
    site: "Utility Yard",
    location: "Super Highway, Karachi",
    contact: { name: "Adeel Munir", phone: "+92 21 3611 4420" },
    category: "Facility Maintenance",
    priority: "Low",
    status: "Waiting for Customer",
    technicianId: "t3",
    created: "2026-09-08T11:00:00",
    createdLabel: "Yesterday, 11:00 AM",
    slaHours: 48,
    slaRemaining: "Awaiting site access",
    overdue: false,
    scheduled: "Thursday, 09:00 AM",
    workInstructions: [],
    timeline: [
      { time: "11:00 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "11:40 AM", label: "Bilal Khan assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "01:15 PM", label: "Waiting for customer access approval", actor: "Bilal Khan", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2024",
    title: "Generator starting fault",
    description: "Standby generator failed weekly auto-start test; battery voltage low.",
    customer: "Sunrise Medical Centre",
    site: "Generator Room",
    location: "Clifton, Karachi",
    contact: { name: "Dr. Zainab Ali", phone: "+92 21 3583 9902" },
    category: "Electrical",
    priority: "Urgent",
    status: "Completed",
    technicianId: "t4",
    created: "2026-09-08T09:00:00",
    createdLabel: "Yesterday, 09:00 AM",
    slaHours: 6,
    slaRemaining: "Resolved in 3h 12m",
    overdue: false,
    scheduled: "Yesterday, 09:45 AM",
    workInstructions: [],
    timeline: [
      { time: "09:00 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "09:20 AM", label: "Sara Ahmed assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "10:15 AM", label: "Technician arrived on site", actor: "Sara Ahmed", customerSafe: true },
      { time: "12:12 PM", label: "Issue resolved", actor: "Sara Ahmed", customerSafe: true },
    ],
    notes: [],
    evidence: [
      { id: "e1", label: "Replacement installed", time: "11:50 AM", tone: "fix" },
      { id: "e2", label: "Final reading", time: "12:10 PM", tone: "after" },
    ],
    resolution: "Starter battery bank replaced and auto-start test passed on three consecutive cycles.",
    history: [],
  },
  {
    id: "TKT-2019",
    title: "Temperature sensor calibration",
    description: "Cold storage sensors reading 2°C above reference probe.",
    customer: "Crescent Foods Factory",
    site: "Cold Store 2",
    location: "Port Qasim, Karachi",
    contact: { name: "Salman Yousuf", phone: "+92 21 3472 1188" },
    category: "Facility Maintenance",
    priority: "Medium",
    status: "Completed",
    technicianId: "t3",
    created: "2026-09-07T13:30:00",
    createdLabel: "07 Sep, 01:30 PM",
    slaHours: 24,
    slaRemaining: "Resolved in 6h 05m",
    overdue: false,
    scheduled: "07 Sep, 03:00 PM",
    workInstructions: [],
    timeline: [
      { time: "01:30 PM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "07:35 PM", label: "Issue resolved", actor: "Bilal Khan", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    resolution: "All four probes recalibrated against reference standard and logged.",
    history: [],
  },
  {
    id: "TKT-2015",
    title: "Lighting circuit tripping",
    description: "Warehouse aisle lighting circuit trips intermittently under load.",
    customer: "Prime Logistics Warehouse",
    site: "Aisle 4 – DB West",
    location: "Super Highway, Karachi",
    contact: { name: "Adeel Munir", phone: "+92 21 3611 4420" },
    category: "Electrical",
    priority: "Medium",
    status: "Rejected",
    technicianId: "t4",
    created: "2026-09-07T10:10:00",
    createdLabel: "07 Sep, 10:10 AM",
    slaHours: 24,
    slaRemaining: "Closed",
    overdue: false,
    scheduled: "07 Sep, 02:00 PM",
    workInstructions: [],
    timeline: [
      { time: "10:10 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "11:02 AM", label: "Rejected by technician", actor: "Sara Ahmed", customerSafe: false, description: "Out of contracted scope — requires licensed contractor." },
    ],
    notes: [{ id: "n1", author: "Sara Ahmed", time: "11:03 AM", body: "Scope belongs to the building's own contractor.", internal: true }],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2012",
    title: "Chiller water leak",
    description: "Minor leak observed at chiller pump flange gasket.",
    customer: "Metro Business Centre",
    site: "Tower B – Plant Room",
    location: "Gulshan-e-Iqbal, Karachi",
    contact: { name: "Farhan Siddiqui", phone: "+92 21 3498 2210" },
    category: "HVAC",
    priority: "Low",
    status: "Cancelled",
    technicianId: null,
    created: "2026-09-06T16:00:00",
    createdLabel: "06 Sep, 04:00 PM",
    slaHours: 48,
    slaRemaining: "Cancelled by customer",
    overdue: false,
    scheduled: "Cancelled",
    workInstructions: [],
    timeline: [
      { time: "04:00 PM", label: "Ticket created", actor: "Customer portal", customerSafe: true },
      { time: "05:20 PM", label: "Cancelled by customer", actor: "Farhan Siddiqui", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2008",
    title: "UPS battery health check",
    description: "Annual UPS battery capacity test for the server room.",
    customer: "Al Noor Commercial Complex",
    site: "Server Room – Ground Floor",
    location: "Shahrah-e-Faisal, Karachi",
    contact: { name: "Muhammad Hamza", phone: "+92 21 3453 9080" },
    category: "Electrical",
    priority: "Low",
    status: "Assigned",
    technicianId: "t1",
    created: "2026-09-09T06:45:00",
    createdLabel: "Today, 06:45 AM",
    slaHours: 48,
    slaRemaining: "Scheduled",
    overdue: false,
    scheduled: "Tomorrow, 09:00 AM",
    workInstructions: ["Run 30 minute discharge test", "Record cell voltages"],
    timeline: [
      { time: "06:45 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "07:00 AM", label: "Ahmed Raza assigned", actor: "Alex Morgan", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2005",
    title: "Exhaust fan motor failure",
    description: "Kitchen exhaust fan motor seized; no extraction in preparation area.",
    customer: "Crescent Foods Factory",
    site: "Canteen Block",
    location: "Port Qasim, Karachi",
    contact: { name: "Salman Yousuf", phone: "+92 21 3472 1188" },
    category: "Facility Maintenance",
    priority: "High",
    status: "In Progress",
    technicianId: "t5",
    created: "2026-09-08T15:45:00",
    createdLabel: "Yesterday, 03:45 PM",
    slaHours: 12,
    slaRemaining: "Overdue by 4h 30m",
    overdue: true,
    scheduled: "Yesterday, 05:00 PM",
    workInstructions: [],
    timeline: [
      { time: "03:45 PM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "04:30 PM", label: "Hassan Javed assigned", actor: "Alex Morgan", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-2001",
    title: "Voltage stabiliser fault",
    description: "Stabiliser tripping on high input voltage during grid switchover.",
    customer: "GreenLine Textiles",
    site: "Unit 2 – Power Room",
    location: "S.I.T.E. Area, Karachi",
    contact: { name: "Nadia Aslam", phone: "+92 21 3225 4410" },
    category: "Electrical",
    priority: "Medium",
    status: "Completed",
    technicianId: "t4",
    created: "2026-09-06T09:20:00",
    createdLabel: "06 Sep, 09:20 AM",
    slaHours: 24,
    slaRemaining: "Resolved in 5h 40m",
    overdue: false,
    scheduled: "06 Sep, 10:00 AM",
    workInstructions: [],
    timeline: [
      { time: "09:20 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "03:00 PM", label: "Issue resolved", actor: "Sara Ahmed", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    resolution: "Input surge protection module replaced and switchover tested.",
    history: [],
  },
  {
    id: "TKT-1998",
    title: "Rooftop array cleaning",
    description: "Soiling losses measured above 8%; cleaning cycle requested.",
    customer: "Atlas Packaging",
    site: "Rooftop Array North",
    location: "Landhi, Karachi",
    contact: { name: "Kamran Rauf", phone: "+92 21 3501 2244" },
    category: "Solar",
    priority: "Low",
    status: "New",
    technicianId: null,
    created: "2026-09-09T09:05:00",
    createdLabel: "Today, 09:05 AM",
    slaHours: 72,
    slaRemaining: "Unassigned",
    overdue: false,
    scheduled: "Unscheduled",
    workInstructions: [],
    timeline: [{ time: "09:05 AM", label: "Ticket created", actor: "Customer portal", customerSafe: true }],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-1994",
    title: "Compressor oil top-up",
    description: "Air compressor low oil warning on daily checklist.",
    customer: "PakTech Manufacturing",
    site: "Plant 1 – Compressor House",
    location: "Korangi Industrial Area, Karachi",
    contact: { name: "Imran Sheikh", phone: "+92 21 3505 7781" },
    category: "Industrial Equipment",
    priority: "Medium",
    status: "Completed",
    technicianId: "t3",
    created: "2026-09-08T08:15:00",
    createdLabel: "Yesterday, 08:15 AM",
    slaHours: 24,
    slaRemaining: "Resolved in 2h 30m",
    overdue: false,
    scheduled: "Yesterday, 09:00 AM",
    workInstructions: [],
    timeline: [
      { time: "08:15 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "10:45 AM", label: "Issue resolved", actor: "Bilal Khan", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    resolution: "Oil topped up to recommended level and leak check completed.",
    history: [],
  },
  {
    id: "TKT-1990",
    title: "Fire pump weekly test failure",
    description: "Jockey pump not maintaining line pressure during weekly test.",
    customer: "Prime Logistics Warehouse",
    site: "Pump House",
    location: "Super Highway, Karachi",
    contact: { name: "Adeel Munir", phone: "+92 21 3611 4420" },
    category: "Facility Maintenance",
    priority: "High",
    status: "Assigned",
    technicianId: "t3",
    created: "2026-09-09T07:30:00",
    createdLabel: "Today, 07:30 AM",
    slaHours: 12,
    slaRemaining: "6h 10m left",
    overdue: false,
    scheduled: "Today, 02:00 PM",
    workInstructions: ["Check pressure switch settings"],
    timeline: [
      { time: "07:30 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "07:50 AM", label: "Bilal Khan assigned", actor: "Alex Morgan", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-1986",
    title: "Split AC gas refill",
    description: "Reception split unit cooling weakly; suspected refrigerant loss.",
    customer: "Sunrise Medical Centre",
    site: "Reception",
    location: "Clifton, Karachi",
    contact: { name: "Dr. Zainab Ali", phone: "+92 21 3583 9902" },
    category: "HVAC",
    priority: "Medium",
    status: "Travelling",
    technicianId: "t2",
    created: "2026-09-09T09:35:00",
    createdLabel: "Today, 09:35 AM",
    slaHours: 12,
    slaRemaining: "8h 45m left",
    overdue: false,
    scheduled: "Today, 01:00 PM",
    workInstructions: [],
    timeline: [
      { time: "09:35 AM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "09:50 AM", label: "Usman Tariq assigned", actor: "Alex Morgan", customerSafe: true },
      { time: "12:20 PM", label: "Technician travelling", actor: "Usman Tariq", customerSafe: true },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
  {
    id: "TKT-1982",
    title: "Panel earthing resistance high",
    description: "Annual test recorded earthing resistance above the acceptable threshold.",
    customer: "GreenLine Textiles",
    site: "Unit 1 – Earth Pit Array",
    location: "S.I.T.E. Area, Karachi",
    contact: { name: "Nadia Aslam", phone: "+92 21 3225 4410" },
    category: "Electrical",
    priority: "High",
    status: "On Hold",
    technicianId: "t1",
    created: "2026-09-07T16:40:00",
    createdLabel: "07 Sep, 04:40 PM",
    slaHours: 48,
    slaRemaining: "Paused — site shutdown required",
    overdue: false,
    scheduled: "Sunday, 08:00 AM",
    workInstructions: [],
    timeline: [
      { time: "04:40 PM", label: "Ticket created", actor: "Alex Morgan", customerSafe: true },
      { time: "05:10 PM", label: "Placed on hold", actor: "Ahmed Raza", customerSafe: true, description: "Requires planned shutdown window." },
    ],
    notes: [],
    evidence: [],
    history: [],
  },
];

export const ticketById = (id: string) => tickets.find((t) => t.id === id) ?? null;

export const customers = Array.from(new Set(tickets.map((t) => t.customer))).sort();

export const statusOrder: TicketStatus[] = [
  "New",
  "Assigned",
  "Travelling",
  "On Site",
  "In Progress",
  "Waiting for Customer",
  "On Hold",
  "Completed",
  "Cancelled",
  "Rejected",
];

export const priorities: Priority[] = ["Low", "Medium", "High", "Urgent"];

export const categories: Category[] = [
  "Solar",
  "HVAC",
  "Electrical",
  "Industrial Equipment",
  "Facility Maintenance",
  "Other",
];

/** Technician workflow: only valid next actions are surfaced. */
export const nextAction = (
  status: TicketStatus,
): { label: string; next: TicketStatus } | null => {
  switch (status) {
    case "Assigned":
      return { label: "Start Travel", next: "Travelling" };
    case "Travelling":
      return { label: "Arrived On Site", next: "On Site" };
    case "On Site":
      return { label: "Start Work", next: "In Progress" };
    case "In Progress":
      return { label: "Complete Job", next: "Completed" };
    default:
      return null;
  }
};

export const customerStages = [
  "Request Received",
  "Technician Assigned",
  "Technician On Site",
  "Work In Progress",
  "Completed",
] as const;

export const customerStageIndex = (status: TicketStatus) => {
  switch (status) {
    case "New":
      return 0;
    case "Assigned":
    case "Travelling":
      return 1;
    case "On Site":
      return 2;
    case "In Progress":
    case "Waiting for Customer":
    case "On Hold":
      return 3;
    case "Completed":
      return 4;
    default:
      return 1;
  }
};

export const kpis = {
  active: tickets.filter((t) =>
    ["New", "Assigned", "Travelling", "On Site", "In Progress", "Waiting for Customer", "On Hold"].includes(t.status),
  ).length,
  overdue: tickets.filter((t) => t.overdue).length,
  working: technicians.filter((t) => t.status === "On Site" || t.status === "Travelling").length,
  completedToday: technicians.reduce((a, t) => a + t.completedToday, 0),
};

export const distribution = [
  { label: "New", value: tickets.filter((t) => t.status === "New").length },
  { label: "Assigned", value: tickets.filter((t) => t.status === "Assigned").length },
  {
    label: "In Progress",
    value: tickets.filter((t) => ["Travelling", "On Site", "In Progress"].includes(t.status)).length,
  },
  {
    label: "On Hold",
    value: tickets.filter((t) => ["On Hold", "Waiting for Customer"].includes(t.status)).length,
  },
  { label: "Completed", value: tickets.filter((t) => t.status === "Completed").length },
];

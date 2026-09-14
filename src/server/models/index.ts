import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

// =============================================================================
// 1. Customer Model
// =============================================================================
export interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyId: string;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const CustomerModel =
  (models["Customer"] as mongoose.Model<ICustomer>) ||
  model<ICustomer>("Customer", CustomerSchema);

// =============================================================================
// 2. Site Model
// =============================================================================
export interface ISite {
  id: string;
  customerId: string;
  name: string;
  address: string;
  siteType: string;
  companyId: string;
}

const SiteSchema = new Schema<ISite>(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    siteType: { type: String, required: true, trim: true },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const SiteModel =
  (models["Site"] as mongoose.Model<ISite>) ||
  model<ISite>("Site", SiteSchema);

// =============================================================================
// 3. Equipment Model
// =============================================================================
export interface IEquipment {
  id: string;
  siteId: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  installDate: string;
  companyId: string;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    siteId: { type: String, required: true, index: true },
    equipmentType: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    installDate: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const EquipmentModel =
  (models["Equipment"] as mongoose.Model<IEquipment>) ||
  model<IEquipment>("Equipment", EquipmentSchema);

// =============================================================================
// 4. Technician Model
// =============================================================================
export interface ITechnician {
  id: string;
  name: string;
  initials?: string;
  phone: string;
  email: string;
  skillSet: string[];
  specialization?: string;
  active: boolean;
  status?: string;
  activeJobs?: number;
  completedToday?: number;
  region?: string;
  rating?: number;
  completionRate?: number;
  companyId: string;
}

const TechnicianSchema = new Schema<ITechnician>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    initials: { type: String },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    skillSet: [{ type: String }],
    specialization: { type: String },
    active: { type: Boolean, default: true, index: true },
    status: { type: String, default: "Available" },
    activeJobs: { type: Number, default: 0 },
    completedToday: { type: Number, default: 0 },
    region: { type: String },
    rating: { type: Number, default: 5.0 },
    completionRate: { type: Number, default: 100 },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const TechnicianModel =
  (models["Technician"] as mongoose.Model<ITechnician>) ||
  model<ITechnician>("Technician", TechnicianSchema);

// =============================================================================
// 5. Ticket Model
// =============================================================================
export const TICKET_STATUSES = [
  "New",
  "Assigned",
  "In Progress",
  "Waiting",
  "Resolved",
  "Closed",
  "Cancelled",
  "Rejected",
] as const;

export const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export interface ITicket {
  id: string;
  customerId: string;
  customerName?: string;
  siteId: string;
  siteName?: string;
  siteAddress?: string;
  equipmentId?: string;
  equipmentModel?: string;
  contact?: { name: string; phone: string; email?: string };
  title: string;
  description: string;
  category: string;
  priority: (typeof TICKET_PRIORITIES)[number];
  status: (typeof TICKET_STATUSES)[number];
  assignedTechnicianId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  workInstructions?: string[];
  resolution?: string;
  companyId: string;
}

const TicketSchema = new Schema<ITicket>(
  {
    id: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String },
    siteId: { type: String, required: true, index: true },
    siteName: { type: String },
    siteAddress: { type: String },
    equipmentId: { type: String, index: true },
    equipmentModel: { type: String },
    contact: {
      name: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    priority: { type: String, required: true, enum: TICKET_PRIORITIES, index: true },
    status: { type: String, required: true, enum: TICKET_STATUSES, index: true },
    assignedTechnicianId: { type: String, default: null, index: true },
    createdBy: { type: String, required: true },
    dueDate: { type: String, required: true, index: true },
    workInstructions: [{ type: String }],
    resolution: { type: String },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

TicketSchema.index({ companyId: 1, status: 1 });
TicketSchema.index({ companyId: 1, assignedTechnicianId: 1 });
TicketSchema.index({ companyId: 1, dueDate: 1 });

export const TicketModel =
  (models["Ticket"] as mongoose.Model<ITicket>) ||
  model<ITicket>("Ticket", TicketSchema);

// =============================================================================
// 6. TicketHistory Model
// =============================================================================
export interface ITicketHistory {
  id: string;
  ticketId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  changedAt: string;
  note?: string;
  isOverride?: boolean;
  companyId: string;
}

const TicketHistorySchema = new Schema<ITicketHistory>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticketId: { type: String, required: true, index: true },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: String, required: true },
    note: { type: String },
    isOverride: { type: Boolean, default: false },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const TicketHistoryModel =
  (models["TicketHistory"] as mongoose.Model<ITicketHistory>) ||
  model<ITicketHistory>("TicketHistory", TicketHistorySchema);

// =============================================================================
// 7. Attachment Model
// =============================================================================
export interface IAttachment {
  id: string;
  ticketId: string;
  name?: string;
  fileName?: string;
  uploadedBy: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | string;
  uploadedAt: string;
  customerVisible: boolean;
  tone?: "before" | "issue" | "fix" | "after";
  companyId: string;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticketId: { type: String, required: true, index: true },
    name: { type: String },
    fileName: { type: String },
    uploadedBy: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Schema.Types.Mixed, required: true },
    uploadedAt: { type: String, required: true },
    customerVisible: { type: Boolean, default: false, index: true },
    tone: { type: String, enum: ["before", "issue", "fix", "after"] },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const AttachmentModel =
  (models["Attachment"] as mongoose.Model<IAttachment>) ||
  model<IAttachment>("Attachment", AttachmentSchema);

// =============================================================================
// 8. Comment / Note Model
// =============================================================================
export interface IComment {
  id: string;
  ticketId: string;
  authorId?: string;
  authorName?: string;
  author?: string;
  authorRole: string;
  text?: string;
  body?: string;
  customerVisible: boolean;
  internal?: boolean;
  createdAt?: string;
  time?: string;
  companyId: string;
}

const CommentSchema = new Schema<IComment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticketId: { type: String, required: true, index: true },
    authorId: { type: String },
    authorName: { type: String },
    author: { type: String },
    authorRole: { type: String, required: true },
    text: { type: String },
    body: { type: String },
    customerVisible: { type: Boolean, default: false, index: true },
    internal: { type: Boolean, default: true },
    createdAt: { type: String },
    time: { type: String },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const CommentModel =
  (models["Comment"] as mongoose.Model<IComment>) ||
  model<IComment>("Comment", CommentSchema);

// =============================================================================
// 9. NotificationLog Model
// =============================================================================
export interface INotificationLog {
  id: string;
  ticketId: string;
  channel: string;
  recipient: string;
  status: string;
  sentAt: string;
  triggerEvent: string;
  messagePreview?: string;
  content?: string;
  companyId: string;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ticketId: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    recipient: { type: String, required: true },
    status: { type: String, required: true },
    sentAt: { type: String, required: true },
    triggerEvent: { type: String, required: true },
    messagePreview: { type: String },
    content: { type: String },
    companyId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

export const NotificationLogModel =
  (models["NotificationLog"] as mongoose.Model<INotificationLog>) ||
  model<INotificationLog>("NotificationLog", NotificationLogSchema);

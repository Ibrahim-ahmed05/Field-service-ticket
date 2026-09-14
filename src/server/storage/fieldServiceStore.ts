import {
  Attachment,
  Comment,
  Customer,
  Equipment,
  Site,
  Technician,
  Ticket,
  TicketHistory,
} from "../types/field-service";
import {
  seedCustomers,
  seedSites,
  seedEquipment,
  seedTechnicians,
  seedTickets,
  seedHistory,
  seedComments,
  seedAttachments,
} from "../../data/seed-data";

export class FieldServiceStore {
  public customers: Customer[] = [];
  public sites: Site[] = [];
  public equipment: Equipment[] = [];
  public technicians: Technician[] = [];
  public tickets: Ticket[] = [];
  public ticketHistory: TicketHistory[] = [];
  public attachments: Attachment[] = [];
  public comments: Comment[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.customers = JSON.parse(JSON.stringify(seedCustomers));
    this.sites = JSON.parse(JSON.stringify(seedSites));
    this.equipment = JSON.parse(JSON.stringify(seedEquipment));
    this.technicians = JSON.parse(JSON.stringify(seedTechnicians));
    this.tickets = JSON.parse(JSON.stringify(seedTickets));
    this.ticketHistory = JSON.parse(JSON.stringify(seedHistory));
    this.comments = JSON.parse(JSON.stringify(seedComments));
    this.attachments = JSON.parse(JSON.stringify(seedAttachments));
  }

  reset() {
    this.seed();
  }
}

// Global in-memory singleton
export const globalStore = new FieldServiceStore();


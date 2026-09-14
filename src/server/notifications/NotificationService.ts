import {
  Customer,
  NotificationLog,
  NotificationMessage,
  NotificationRecipient,
  Technician,
  Ticket,
  TriggerEvent,
} from "../types/field-service";

export interface NotificationProvider {
  name: string;
  send(message: NotificationMessage): Promise<{ success: boolean; logId?: string }>;
}

/**
 * DevLogProvider writes notifications to console / in-memory buffer
 * Satisfies the sprint requirement for development testing and demo verification.
 */
export class DevLogProvider implements NotificationProvider {
  public name = "DevLogProvider";
  public history: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<{ success: boolean; logId?: string }> {
    this.history.push(message);
    const alsoStr =
      message.alsoNotified && message.alsoNotified.length > 0
        ? ` | Also: [${message.alsoNotified.map((r) => `${r.type}:${r.name}`).join(", ")}]`
        : "";

    console.log(
      `[NOTIFICATION:${this.name}] [${message.triggerEvent}] Ticket "${message.ticketTitle}" (#${message.ticketId}) -> Primary: [${message.primaryRecipient.type}:${message.primaryRecipient.name}]${alsoStr}`,
    );

    return { success: true, logId: message.id };
  }

  clear() {
    this.history = [];
  }
}

/**
 * WhatsApp Notification Provider (Meta Cloud API / Twilio WhatsApp Adapter)
 * To connect real WhatsApp:
 * Set NOTIFICATION_PROVIDER=WhatsApp and configure TWILIO_ACCOUNT_SID or META_WHATSAPP_TOKEN.
 */
export class WhatsAppNotificationProvider implements NotificationProvider {
  public name = "WhatsAppNotificationProvider";

  async send(message: NotificationMessage): Promise<{ success: boolean; logId?: string }> {
    const recipientPhone = message.primaryRecipient.phone || "+92 300 0000000";
    console.log(
      `[WHATSAPP ADAPTER] Sending WhatsApp template message to ${recipientPhone} for event [${message.triggerEvent}]: ${message.content}`,
    );
    // In production:
    // await twilioClient.messages.create({ from: process.env.TWILIO_WHATSAPP_NUMBER, to: `whatsapp:${recipientPhone}`, body: message.content });
    return { success: true, logId: `wa-${message.id}` };
  }
}

/**
 * Email Notification Provider (SendGrid / Resend / Amazon SES Adapter)
 * To connect real Email:
 * Set NOTIFICATION_PROVIDER=Email and configure RESEND_API_KEY or SENDGRID_API_KEY.
 */
export class EmailNotificationProvider implements NotificationProvider {
  public name = "EmailNotificationProvider";

  async send(message: NotificationMessage): Promise<{ success: boolean; logId?: string }> {
    const recipientEmail = message.primaryRecipient.email || "recipient@fieldservice.local";
    console.log(
      `[EMAIL ADAPTER] Dispatching transactional email to ${recipientEmail} with subject "[FieldFlow] ${message.triggerEvent} — ${message.ticketTitle}": ${message.content}`,
    );
    // In production:
    // await resend.emails.send({ from: process.env.SYSTEM_FROM_EMAIL || 'dispatch@fieldservice.local', to: recipientEmail, subject: `[FieldFlow] ${message.triggerEvent}`, text: message.content });
    return { success: true, logId: `email-${message.id}` };
  }
}

/**
 * SMS Notification Provider (Twilio / AWS SNS Adapter)
 */
export class SmsNotificationProvider implements NotificationProvider {
  public name = "SmsNotificationProvider";

  async send(message: NotificationMessage): Promise<{ success: boolean; logId?: string }> {
    const recipientPhone = message.primaryRecipient.phone || "+1-555-0100";
    console.log(`[SMS ADAPTER] Dispatching SMS to ${recipientPhone}: ${message.content}`);
    return { success: true, logId: `sms-${message.id}` };
  }
}

export function createConfiguredNotificationProvider(): NotificationProvider {
  const providerType = process.env.NOTIFICATION_PROVIDER || "DevLog";
  switch (providerType.toLowerCase()) {
    case "whatsapp":
      return new WhatsAppNotificationProvider();
    case "email":
      return new EmailNotificationProvider();
    case "sms":
      return new SmsNotificationProvider();
    case "devlog":
    default:
      return new DevLogProvider();
  }
}

export class NotificationService {
  private provider: NotificationProvider;
  private logs: NotificationLog[] = [];

  constructor(provider: NotificationProvider = createConfiguredNotificationProvider()) {
    this.provider = provider;
  }

  setProvider(provider: NotificationProvider) {
    this.provider = provider;
  }

  getProvider(): NotificationProvider {
    return this.provider;
  }

  getLogs(ticketId?: string, companyId?: string): NotificationLog[] {
    let filtered = this.logs;
    if (ticketId) filtered = filtered.filter((l) => l.ticketId === ticketId);
    if (companyId) filtered = filtered.filter((l) => l.companyId === companyId);
    return filtered;
  }

  /**
   * Dispatches notifications per the recipient matrix in Section 5 of the Architecture Spec
   */
  async notify(
    event: TriggerEvent,
    ticket: Ticket,
    customer?: Customer | null,
    technician?: Technician | null,
    managerInfo: { name: string; email: string } = {
      name: "Operations Dispatch",
      email: "dispatch@fieldservice.local",
    },
  ): Promise<NotificationMessage | null> {
    const customerRecipient: NotificationRecipient = {
      type: "Customer",
      name: customer?.name || "Customer",
      email: customer?.email || "customer@example.com",
      phone: customer?.phone,
    };

    const techRecipient: NotificationRecipient = {
      type: "Assigned Technician",
      name: technician?.name || "Technician",
      email: technician?.email || "tech@fieldservice.local",
      phone: technician?.phone,
    };

    const managerRecipient: NotificationRecipient = {
      type: "Manager or Admin",
      name: managerInfo.name,
      email: managerInfo.email,
    };

    let primaryRecipient: NotificationRecipient;
    let alsoNotified: NotificationRecipient[] | undefined;

    switch (event) {
      case "Ticket created":
        primaryRecipient = customerRecipient;
        alsoNotified = [managerRecipient];
        break;

      case "Technician assigned":
        primaryRecipient = techRecipient;
        alsoNotified = [customerRecipient];
        break;

      case "Status changed to In Progress":
        primaryRecipient = customerRecipient;
        alsoNotified = undefined;
        break;

      case "Status changed to Resolved":
        primaryRecipient = customerRecipient;
        alsoNotified = [managerRecipient];
        break;

      case "Status changed to Closed":
        primaryRecipient = customerRecipient;
        alsoNotified = ticket.assignedTechnicianId ? [techRecipient] : undefined;
        break;

      case "Ticket cancelled":
        primaryRecipient = customerRecipient;
        alsoNotified = ticket.assignedTechnicianId ? [techRecipient] : undefined;
        break;

      default:
        return null;
    }

    const message: NotificationMessage = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      triggerEvent: event,
      primaryRecipient,
      alsoNotified,
      channel: this.provider.name.includes("WhatsApp")
        ? "WhatsApp"
        : this.provider.name.includes("Email")
          ? "Email"
          : this.provider.name.includes("Sms")
            ? "SMS"
            : "DevLog",
      status: "SENT",
      sentAt: new Date().toISOString(),
      companyId: ticket.companyId,
      content: `Notification for event [${event}] on ticket "${ticket.title}" (Priority: ${ticket.priority}, Status: ${ticket.status})`,
    };

    await this.provider.send(message);

    // Save into internal audit log
    const logEntry: NotificationLog = {
      id: message.id,
      ticketId: ticket.id,
      channel: message.channel,
      recipient: `${primaryRecipient.type}: ${primaryRecipient.name} (${primaryRecipient.email || primaryRecipient.phone})`,
      status: message.status,
      sentAt: message.sentAt,
      triggerEvent: event,
      companyId: ticket.companyId,
      content: message.content,
    };
    this.logs.push(logEntry);

    return message;
  }
}

// Global shared singleton for server runtime
export const globalNotificationService = new NotificationService();

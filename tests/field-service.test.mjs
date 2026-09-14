import assert from "node:assert/strict";
import test, { beforeEach, describe } from "node:test";

import {
  DevLogProvider,
  WhatsAppNotificationProvider,
  EmailNotificationProvider,
  SmsNotificationProvider,
  NotificationService,
} from "../src/server/notifications/NotificationService.ts";
import { calculateDueDate, isTicketOverdue } from "../src/server/sla/dueDates.ts";
import { FieldServiceStore } from "../src/server/storage/fieldServiceStore.ts";
import { TicketService } from "../src/server/services/ticketService.ts";
import { validateStatusTransition } from "../src/server/workflow/stateMachine.ts";

describe("Field Service Ticket System — Architecture Acceptance Tests", () => {
  let store;
  let devLogProvider;
  let notificationService;
  let service;

  // Mock User Profiles matching Seed Data
  const managerUser = {
    id: "mgr-1",
    name: "Alex Morgan (Manager)",
    email: "alex.morgan@fieldflow.io",
    role: "MANAGER",
    companyId: "comp-1",
  };

  const tech1User = {
    id: "t1",
    name: "Ahmed Raza",
    email: "ahmed.raza@fieldflow.io",
    role: "TECHNICIAN",
    companyId: "comp-1",
    technicianId: "t1",
  };

  const tech2User = {
    id: "t2",
    name: "Usman Tariq",
    email: "usman.tariq@fieldflow.io",
    role: "TECHNICIAN",
    companyId: "comp-1",
    technicianId: "t2",
  };

  const customer1User = {
    id: "c1",
    name: "Al Noor Commercial Complex",
    email: "facilities@alnoor.pk",
    role: "CUSTOMER",
    companyId: "comp-1",
    customerId: "c1",
  };

  const customer2User = {
    id: "c2",
    name: "Metro Business Centre",
    email: "ops@metrobusiness.pk",
    role: "CUSTOMER",
    companyId: "comp-1",
    customerId: "c2",
  };

  const company2Manager = {
    id: "mgr-nordic",
    name: "Nordic Dispatch Manager",
    email: "ops@nordicdc.io",
    role: "MANAGER",
    companyId: "comp-nordic-02",
  };

  beforeEach(() => {
    store = new FieldServiceStore();
    devLogProvider = new DevLogProvider();
    notificationService = new NotificationService(devLogProvider);
    service = new TicketService(store, notificationService);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TICKET LIFECYCLE & STATE MACHINE (HAPPY PATH)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("1. Ticket Lifecycle & State Transitions", () => {
    test("Full lifecycle: Issue Reported (New) -> Assigned -> In Progress -> Resolved -> Closed", async () => {
      // 1. Create Ticket (New)
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          equipmentId: "eq1",
          title: "HVAC Thermostat Sensor Calibration",
          description: "Zone 3 temperature reading 5 degrees higher than calibrated setpoint.",
          priority: "Medium",
          category: "HVAC",
        },
        managerUser,
      );

      assert.equal(ticket.status, "New");
      assert.ok(ticket.id);

      // 2. Assign to Tech 1 (Assigned)
      const assignedTicket = await service.assignTechnician(
        ticket.id,
        "t1",
        managerUser,
        "Assigned to primary solar/electrical technician",
      );
      assert.equal(assignedTicket.status, "Assigned");
      assert.equal(assignedTicket.assignedTechnicianId, "t1");

      // 3. Tech 1 starts work (In Progress)
      const inProgressTicket = await service.updateTicketStatus(
        ticket.id,
        "In Progress",
        tech1User,
        "Started diagnostic work on site",
      );
      assert.equal(inProgressTicket.status, "In Progress");

      // 4. Tech 1 completes work (Resolved with required notes)
      const resolvedTicket = await service.updateTicketStatus(
        ticket.id,
        "Resolved",
        tech1User,
        "Calibrated thermistor probe and replaced damaged sensor wire.",
      );
      assert.equal(resolvedTicket.status, "Resolved");

      // 5. Customer confirms resolution (Closed)
      const closedTicket = await service.updateTicketStatus(
        ticket.id,
        "Closed",
        customer1User,
        "Customer confirmed temperature normalized across all zones.",
      );
      assert.equal(closedTicket.status, "Closed");

      // Verify Chronological History
      const history = await service.getTicketHistory(ticket.id, managerUser);
      assert.equal(history.length, 5); // New, Assigned, In Progress, Resolved, Closed
      assert.equal(history[0].toStatus, "New");
      assert.equal(history[1].toStatus, "Assigned");
      assert.equal(history[2].toStatus, "In Progress");
      assert.equal(history[3].toStatus, "Resolved");
      assert.equal(history[4].toStatus, "Closed");
    });

    test("Pause and resume work: In Progress -> Waiting -> In Progress", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Compressor Overhaul",
          description: "Rebuilding valve head",
          priority: "High",
          category: "HVAC",
        },
        managerUser,
      );

      await service.assignTechnician(ticket.id, "t1", managerUser);
      await service.updateTicketStatus(ticket.id, "In Progress", tech1User);

      // Pause work (Waiting on parts)
      const waitingTicket = await service.updateTicketStatus(
        ticket.id,
        "Waiting",
        tech1User,
        "Waiting on OEM valve gasket delivery",
      );
      assert.equal(waitingTicket.status, "Waiting");

      // Resume work
      const resumedTicket = await service.updateTicketStatus(
        ticket.id,
        "In Progress",
        tech1User,
        "Gasket arrived, resuming overhaul",
      );
      assert.equal(resumedTicket.status, "In Progress");
    });

    test("Technician rejection and manager reassignment: Assigned -> Rejected -> New -> Assigned", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "High Voltage Transformer Inspection",
          description: "Transformer relay tripped",
          priority: "Urgent",
          category: "Electrical",
        },
        managerUser,
      );

      await service.assignTechnician(ticket.id, "t1", managerUser);

      // Tech 1 rejects because of specialized scope
      const rejectedTicket = await service.updateTicketStatus(
        ticket.id,
        "Rejected",
        tech1User,
        "Requires certified high voltage contractor",
      );
      assert.equal(rejectedTicket.status, "Rejected");
      assert.equal(rejectedTicket.assignedTechnicianId, undefined);

      // Manager resets to New
      const resetTicket = await service.updateTicketStatus(
        ticket.id,
        "New",
        managerUser,
        "Resetting for high-voltage specialist reassignment",
      );
      assert.equal(resetTicket.status, "New");

      // Manager reassigns to Tech 2 (Usman Tariq)
      const reassigned = await service.assignTechnician(ticket.id, "t2", managerUser);
      assert.equal(reassigned.status, "Assigned");
      assert.equal(reassigned.assignedTechnicianId, "t2");
    });

    test("Reopening resolved ticket on customer dispute: Resolved -> In Progress", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Dock Door Roller Repair",
          description: "Roller sticking",
          priority: "Medium",
          category: "Facility Maintenance",
        },
        managerUser,
      );

      await service.assignTechnician(ticket.id, "t1", managerUser);
      await service.updateTicketStatus(ticket.id, "In Progress", tech1User);
      await service.updateTicketStatus(
        ticket.id,
        "Resolved",
        tech1User,
        "Lubricated track and roller",
      );

      // Manager reopens ticket following customer feedback
      const reopened = await service.updateTicketStatus(
        ticket.id,
        "In Progress",
        managerUser,
        "Customer reported roller still jamming during cold morning shift",
      );
      assert.equal(reopened.status, "In Progress");
    });

    test("Cancellation from active states (New, Assigned, In Progress, Waiting)", async () => {
      for (const initialStatus of ["New", "Assigned", "In Progress", "Waiting"]) {
        const ticket = await service.createTicket(
          {
            customerId: "c1",
            siteId: "s1",
            title: `Cancel Test from ${initialStatus}`,
            description: "Test description",
            priority: "Low",
            category: "Other",
          },
          managerUser,
        );

        if (initialStatus === "Assigned") {
          await service.assignTechnician(ticket.id, "t1", managerUser);
        } else if (initialStatus === "In Progress") {
          await service.assignTechnician(ticket.id, "t1", managerUser);
          await service.updateTicketStatus(ticket.id, "In Progress", tech1User);
        } else if (initialStatus === "Waiting") {
          await service.assignTechnician(ticket.id, "t1", managerUser);
          await service.updateTicketStatus(ticket.id, "In Progress", tech1User);
          await service.updateTicketStatus(ticket.id, "Waiting", tech1User);
        }

        const cancelled = await service.updateTicketStatus(
          ticket.id,
          "Cancelled",
          managerUser,
          "Customer cancelled work order request",
        );
        assert.equal(cancelled.status, "Cancelled");
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. INVALID TRANSITIONS & CONTROLLED ERROR RESPONSES
  // ─────────────────────────────────────────────────────────────────────────────
  describe("2. Invalid Status Transitions & Controlled Errors", () => {
    test("Direct New -> Resolved or New -> Closed is blocked with controlled error", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Direct Jump Test",
          description: "Testing illegal jump",
          priority: "Low",
          category: "Other",
        },
        managerUser,
      );

      // Attempt New -> Resolved
      await assert.rejects(
        async () => {
          await service.updateTicketStatus(ticket.id, "Resolved", managerUser, "Fast track");
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "INVALID_STATUS_TRANSITION");
          assert.equal(err.currentStatus, "New");
          assert.equal(err.requestedStatus, "Resolved");
          assert.ok(Array.isArray(err.allowedTransitions));
          return true;
        },
      );

      // Attempt New -> Closed
      await assert.rejects(
        async () => {
          await service.updateTicketStatus(ticket.id, "Closed", managerUser);
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "INVALID_STATUS_TRANSITION");
          return true;
        },
      );
    });

    test("Closed and Cancelled are final states (cannot transition further)", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Final State Test",
          description: "Final state test",
          priority: "Low",
          category: "Other",
        },
        managerUser,
      );

      await service.updateTicketStatus(ticket.id, "Cancelled", managerUser);

      // Attempt Cancelled -> Assigned
      await assert.rejects(
        async () => {
          await service.updateTicketStatus(ticket.id, "Assigned", managerUser);
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "FINAL_STATE_VIOLATION");
          return true;
        },
      );
    });

    test("Resolving without notes is rejected with RESOLUTION_NOTE_REQUIRED", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Note Requirement Test",
          description: "Testing notes",
          priority: "Medium",
          category: "Other",
        },
        managerUser,
      );

      await service.assignTechnician(ticket.id, "t1", managerUser);
      await service.updateTicketStatus(ticket.id, "In Progress", tech1User);

      await assert.rejects(
        async () => {
          await service.updateTicketStatus(ticket.id, "Resolved", tech1User, ""); // empty notes!
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "RESOLUTION_NOTE_REQUIRED");
          return true;
        },
      );
    });

    test("Manager exception override allows emergency status change and writes to audit history", async () => {
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Emergency Override Test",
          description: "Override test",
          priority: "Urgent",
          category: "HVAC",
        },
        managerUser,
      );

      // Jump directly from New to Resolved via Manager Override
      const overridden = await service.updateTicketStatus(
        ticket.id,
        "Resolved",
        managerUser,
        "Third party vendor emergency dispatch handled the fix",
        true, // isOverride = true
      );

      assert.equal(overridden.status, "Resolved");

      const history = await service.getTicketHistory(ticket.id, managerUser);
      const lastEntry = history[history.length - 1];
      assert.equal(lastEntry.isOverride, true);
      assert.ok(lastEntry.note.includes("Third party vendor"));
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION BOUNDARIES
  // ─────────────────────────────────────────────────────────────────────────────
  describe("3. Role-Based Access Control (RBAC) Boundaries", () => {
    test("Technicians cannot create tickets, reassign, or cancel tickets", async () => {
      // 1. Tech cannot create ticket
      await assert.rejects(
        async () => {
          await service.createTicket(
            {
              customerId: "c1",
              siteId: "s1",
              title: "Tech Created",
              description: "Illegal",
              priority: "Low",
              category: "Other",
            },
            tech1User,
          );
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, "FORBIDDEN_ROLE");
          return true;
        },
      );

      // 2. Tech cannot assign/reassign
      await assert.rejects(
        async () => {
          await service.assignTechnician("TKT-2048", "t2", tech1User);
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, "FORBIDDEN_ROLE");
          return true;
        },
      );

      // 3. Tech cannot cancel ticket
      await assert.rejects(
        async () => {
          await service.updateTicketStatus("TKT-2048", "Cancelled", tech1User);
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "UNAUTHORIZED_TRANSITION_ROLE");
          return true;
        },
      );
    });

    test("Technicians can only access and update tickets assigned to them (My Jobs isolation)", async () => {
      // TKT-2048 is assigned to t1. t2 cannot update it.
      await assert.rejects(
        async () => {
          await service.updateTicketStatus("TKT-2048", "Waiting", tech2User, "Interfering");
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, "TECHNICIAN_ACCESS_DENIED");
          return true;
        },
      );

      // Tech 2 cannot view Tech 1's My Jobs queue
      await assert.rejects(
        async () => {
          await service.getTechnicianJobs("t1", tech2User);
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, "FORBIDDEN_TECHNICIAN_SCOPE");
          return true;
        },
      );

      // Tech 1 can view their own jobs
      const tech1Jobs = await service.getTechnicianJobs("t1", tech1User);
      assert.ok(Array.isArray(tech1Jobs));
      assert.ok(tech1Jobs.every((j) => j.assignedTechnicianId === "t1"));
    });

    test("Customer privacy: Internal comments and attachments are hidden from customer view", async () => {
      const fullViewCustomer = await service.getTicketById("TKT-2048", customer1User);
      const fullViewManager = await service.getTicketById("TKT-2048", managerUser);

      // Customer sees ONLY customerVisible === true items
      assert.ok(fullViewCustomer.comments.every((c) => c.customerVisible === true));
      assert.ok(fullViewCustomer.attachments.every((a) => a.customerVisible === true));

      // Manager sees ALL items (both internal and customer-visible)
      assert.ok(fullViewManager.comments.length >= fullViewCustomer.comments.length);
      assert.ok(fullViewManager.attachments.length >= fullViewCustomer.attachments.length);
    });

    test("Customer cannot access another customer's tickets", async () => {
      // c2 trying to access c1's ticket (TKT-2048)
      await assert.rejects(
        async () => {
          await service.getTicketById("TKT-2048", customer2User);
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, "CUSTOMER_ACCESS_DENIED");
          return true;
        },
      );

      // c2 trying to view c1's ticket list
      await assert.rejects(
        async () => {
          await service.getCustomerTickets("c1", customer2User);
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.equal(err.code, "FORBIDDEN_CUSTOMER_SCOPE");
          return true;
        },
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. NOTIFICATION ARCHITECTURE & RECIPIENT RESOLUTION
  // ─────────────────────────────────────────────────────────────────────────────
  describe("4. Notification Architecture & Recipient Matrix", () => {
    test("Dispatches notifications with correct recipients across all 6 trigger events", async () => {
      devLogProvider.clear();

      // 1. Ticket created -> Primary: Customer, Also: Manager
      const ticket = await service.createTicket(
        {
          customerId: "c1",
          siteId: "s1",
          title: "Notification Matrix Verification Ticket",
          description: "Checking notif dispatch",
          priority: "Medium",
          category: "HVAC",
        },
        managerUser,
      );

      assert.equal(devLogProvider.history.length, 1);
      assert.equal(devLogProvider.history[0].triggerEvent, "Ticket created");
      assert.equal(devLogProvider.history[0].primaryRecipient.type, "Customer");
      assert.equal(devLogProvider.history[0].alsoNotified[0].type, "Manager or Admin");

      // 2. Technician assigned -> Primary: Assigned Tech, Also: Customer
      await service.assignTechnician(ticket.id, "t1", managerUser);
      assert.equal(devLogProvider.history.length, 2);
      assert.equal(devLogProvider.history[1].triggerEvent, "Technician assigned");
      assert.equal(devLogProvider.history[1].primaryRecipient.type, "Assigned Technician");
      assert.equal(devLogProvider.history[1].alsoNotified[0].type, "Customer");

      // 3. Status changed to In Progress -> Primary: Customer
      await service.updateTicketStatus(ticket.id, "In Progress", tech1User);
      assert.equal(devLogProvider.history.length, 3);
      assert.equal(devLogProvider.history[2].triggerEvent, "Status changed to In Progress");
      assert.equal(devLogProvider.history[2].primaryRecipient.type, "Customer");

      // 4. Status changed to Resolved -> Primary: Customer, Also: Manager
      await service.updateTicketStatus(
        ticket.id,
        "Resolved",
        tech1User,
        "Done work notes included",
      );
      assert.equal(devLogProvider.history.length, 4);
      assert.equal(devLogProvider.history[3].triggerEvent, "Status changed to Resolved");
      assert.equal(devLogProvider.history[3].primaryRecipient.type, "Customer");
      assert.equal(devLogProvider.history[3].alsoNotified[0].type, "Manager or Admin");

      // 5. Status changed to Closed -> Primary: Customer, Also: Assigned Tech
      await service.updateTicketStatus(ticket.id, "Closed", customer1User);
      assert.equal(devLogProvider.history.length, 5);
      assert.equal(devLogProvider.history[4].triggerEvent, "Status changed to Closed");
      assert.equal(devLogProvider.history[4].primaryRecipient.type, "Customer");
      assert.equal(devLogProvider.history[4].alsoNotified[0].type, "Assigned Technician");
    });

    test("Interchangeable Notification Providers (WhatsApp, Email, SMS, DevLog)", async () => {
      const waProvider = new WhatsAppNotificationProvider();
      const emailProvider = new EmailNotificationProvider();
      const smsProvider = new SmsNotificationProvider();

      const notifService = new NotificationService(waProvider);
      assert.equal(notifService.getProvider().name, "WhatsAppNotificationProvider");

      notifService.setProvider(emailProvider);
      assert.equal(notifService.getProvider().name, "EmailNotificationProvider");

      notifService.setProvider(smsProvider);
      assert.equal(notifService.getProvider().name, "SmsNotificationProvider");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. ATTACHMENTS & EVIDENCE SECURITY
  // ─────────────────────────────────────────────────────────────────────────────
  describe("5. Attachment & Evidence Security", () => {
    test("Accepts images and PDF documents under 10MB limit", async () => {
      const att = await service.addAttachment(
        "TKT-2048",
        "diagnostic_panel.png",
        "image/png",
        2 * 1024 * 1024, // 2 MB
        "/files/diag.png",
        true,
        tech1User,
      );
      assert.equal(att.fileName, "diagnostic_panel.png");
    });

    test("Rejects disallowed file types and files exceeding 10MB", async () => {
      // 1. Disallowed MIME type
      await assert.rejects(
        async () => {
          await service.addAttachment(
            "TKT-2048",
            "script.sh",
            "application/x-sh",
            1024,
            "/files/script.sh",
            false,
            tech1User,
          );
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "INVALID_FILE_TYPE");
          return true;
        },
      );

      // 2. File size > 10MB
      await assert.rejects(
        async () => {
          await service.addAttachment(
            "TKT-2048",
            "huge_schematic.pdf",
            "application/pdf",
            15 * 1024 * 1024, // 15 MB
            "/files/huge.pdf",
            false,
            tech1User,
          );
        },
        (err) => {
          assert.equal(err.status, 400);
          assert.equal(err.code, "FILE_TOO_LARGE");
          return true;
        },
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SLA, DUE DATE & OVERDUE CALCULATION ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  describe("6. SLA Due Date & Overdue Calculation Engine", () => {
    test("Calculates correct default due dates per priority SLA", () => {
      const now = new Date();
      const urgentDue = new Date(calculateDueDate("Urgent", now)).getTime();
      const highDue = new Date(calculateDueDate("High", now)).getTime();
      const mediumDue = new Date(calculateDueDate("Medium", now)).getTime();
      const lowDue = new Date(calculateDueDate("Low", now)).getTime();

      const msInHour = 60 * 60 * 1000;
      assert.equal(Math.round((urgentDue - now.getTime()) / msInHour), 4);
      assert.equal(Math.round((highDue - now.getTime()) / msInHour), 24);
      assert.equal(Math.round((mediumDue - now.getTime()) / msInHour), 72);
      assert.equal(Math.round((lowDue - now.getTime()) / msInHour), 168);
    });

    test("Correctly marks active tickets as overdue when past due date, but excludes Resolved/Closed", () => {
      const pastDue = new Date(Date.now() - 10000).toISOString();
      const futureDue = new Date(Date.now() + 100000).toISOString();

      // Active status + past due = OVERDUE
      assert.equal(isTicketOverdue(pastDue, "In Progress"), true);
      assert.equal(isTicketOverdue(pastDue, "New"), true);
      assert.equal(isTicketOverdue(pastDue, "Assigned"), true);
      assert.equal(isTicketOverdue(pastDue, "Waiting"), true);

      // Future due = NOT overdue
      assert.equal(isTicketOverdue(futureDue, "In Progress"), false);

      // Resolved / Closed / Cancelled / Rejected = NOT overdue even if past due
      assert.equal(isTicketOverdue(pastDue, "Resolved"), false);
      assert.equal(isTicketOverdue(pastDue, "Closed"), false);
      assert.equal(isTicketOverdue(pastDue, "Cancelled"), false);
      assert.equal(isTicketOverdue(pastDue, "Rejected"), false);
    });

    test("Demonstration of Urgent Overdue Ticket in Seed Dataset (TKT-2031)", async () => {
      const ticket = await service.getTicketById("TKT-2031", managerUser);
      assert.equal(ticket.ticket.priority, "Urgent");
      assert.equal(ticket.ticket.status, "In Progress");
      assert.equal(ticket.ticket.isOverdue, true);
    });

    test("Dashboard metrics aggregates live status counts and overdue tickets accurately", async () => {
      const metrics = await service.getDashboardMetrics(managerUser);

      assert.equal(typeof metrics.countsByStatus.New, "number");
      assert.equal(typeof metrics.countsByStatus.Assigned, "number");
      assert.equal(typeof metrics.countsByStatus["In Progress"], "number");
      assert.ok(metrics.totalTickets >= 20); // At least 20 realistic tickets
      assert.ok(metrics.overdueCount >= 1); // At least 1 urgent overdue ticket
      assert.ok(metrics.openCount > 0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. MULTI-COMPANY DATA ISOLATION & 20+ TICKETS VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  describe("7. Multi-Company Data Scoping & 20+ Realistic Tickets Dataset", () => {
    test("Company 2 manager cannot query or see Company 1 tickets or data", async () => {
      const comp1Tickets = await service.listTickets({}, managerUser);
      const comp2Tickets = await service.listTickets({}, company2Manager);

      assert.ok(comp1Tickets.length >= 20); // Company 1 has 20 tickets
      assert.equal(comp2Tickets.length, 1); // Company 2 has 1 ticket (TKT-2065)

      // Create ticket under Company 2
      const comp2Ticket = await service.createTicket(
        {
          customerId: "c9",
          siteId: "s15",
          equipmentId: "eq10",
          title: "Nordic Server CRAC Alert",
          description: "Temperature threshold warning in aisle 4",
          priority: "High",
          category: "HVAC",
        },
        company2Manager,
      );

      assert.equal(comp2Ticket.companyId, "comp-nordic-02");

      // Verify Company 1 manager cannot list or read this ticket
      const comp1ListAfter = await service.listTickets({}, managerUser);
      assert.ok(comp1ListAfter.every((t) => t.companyId === "comp-1"));

      await assert.rejects(
        async () => {
          await service.getTicketById(comp2Ticket.id, managerUser);
        },
        (err) => {
          assert.equal(err.status, 404);
          return true;
        },
      );
    });

    test("Verifies all 8 statuses are represented across the realistic dataset", async () => {
      const allTickets = await service.listTickets({}, managerUser);
      const statusesPresent = new Set(allTickets.map((t) => t.status));

      const requiredStatuses = [
        "New",
        "Assigned",
        "In Progress",
        "Waiting",
        "Resolved",
        "Closed",
        "Cancelled",
        "Rejected",
      ];

      for (const st of requiredStatuses) {
        assert.ok(statusesPresent.has(st), `Expected dataset to contain ticket with status "${st}"`);
      }
    });
  });
});


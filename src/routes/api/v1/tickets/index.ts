import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { TicketPriority, TicketStatus } from "@/server/types/field-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = extractAuthUser(request);
          const url = new URL(request.url);

          const status = (url.searchParams.get("status") as TicketStatus) || undefined;
          const priority = (url.searchParams.get("priority") as TicketPriority) || undefined;
          const technicianId = url.searchParams.get("technicianId") || undefined;
          const customerId = url.searchParams.get("customerId") || undefined;
          const siteId = url.searchParams.get("siteId") || undefined;
          const overdueOnly = url.searchParams.get("overdue") === "true";

          const tickets = await globalTicketService.listTickets(
            { status, priority, technicianId, customerId, siteId, overdueOnly },
            user,
          );

          return jsonResponse({ success: true, count: tickets.length, tickets });
        } catch (err) {
          return errorResponse(err);
        }
      },

      POST: async ({ request }) => {
        try {
          const user = extractAuthUser(request);
          const body = await request.json();

          const ticket = await globalTicketService.createTicket(body, user);
          return jsonResponse({ success: true, ticket }, 201);
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

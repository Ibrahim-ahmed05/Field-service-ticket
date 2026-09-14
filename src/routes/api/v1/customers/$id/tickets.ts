import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/customers/$id/tickets")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const customerId = params["id"];

          const tickets = await globalTicketService.getCustomerTickets(customerId, user);
          return jsonResponse({ success: true, count: tickets.length, tickets });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

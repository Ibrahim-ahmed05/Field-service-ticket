import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/$id/")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const ticketId = params["id"];

          const fullTicket = await globalTicketService.getTicketById(ticketId, user);
          return jsonResponse({ success: true, data: fullTicket });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

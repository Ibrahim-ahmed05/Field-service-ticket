import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/$id/history")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const ticketId = params["id"];

          const history = await globalTicketService.getTicketHistory(ticketId, user);
          return jsonResponse({ success: true, count: history.length, history });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

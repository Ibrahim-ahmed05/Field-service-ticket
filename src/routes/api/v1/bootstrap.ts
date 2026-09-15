import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/bootstrap")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = extractAuthUser(request);
          const data = await globalTicketService.getBootstrap(user);
          return jsonResponse({ success: true, data });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

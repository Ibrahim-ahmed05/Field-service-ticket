import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/dashboard/metrics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = extractAuthUser(request);
          const metrics = await globalTicketService.getDashboardMetrics(user);

          return jsonResponse({ success: true, metrics });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/technicians/$id/jobs")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const technicianId = params["id"];

          const jobs = await globalTicketService.getTechnicianJobs(technicianId, user);
          return jsonResponse({ success: true, count: jobs.length, jobs });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/$id/assign")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const ticketId = params["id"];
          const body = await request.json();

          if (body.technicianId === undefined) {
            return jsonResponse(
              {
                status: 400,
                code: "MISSING_TECHNICIAN_ID",
                message: "technicianId is required and may be null to unassign.",
              },
              400,
            );
          }

          const ticket = await globalTicketService.assignTechnician(
            ticketId,
            body.technicianId,
            user,
            body.note,
          );

          return jsonResponse({ success: true, ticket });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

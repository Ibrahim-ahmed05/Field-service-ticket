import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { TicketStatus } from "@/server/types/field-service";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/$id/status")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const ticketId = params["id"];
          const body = await request.json();

          if (!body.status) {
            return jsonResponse(
              {
                status: 400,
                code: "MISSING_STATUS",
                message: "status field is required.",
              },
              400,
            );
          }

          const ticket = await globalTicketService.updateTicketStatus(
            ticketId,
            body.status as TicketStatus,
            user,
            body.note,
            Boolean(body.isOverride),
          );

          return jsonResponse({ success: true, ticket });
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

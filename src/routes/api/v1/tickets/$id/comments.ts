import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/$id/comments")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const ticketId = params["id"];
          const body = await request.json();

          if (!body.text || !body.text.trim()) {
            return jsonResponse(
              {
                status: 400,
                code: "EMPTY_COMMENT",
                message: "Comment text cannot be empty.",
              },
              400,
            );
          }

          const customerVisible =
            body.customerVisible !== undefined ? Boolean(body.customerVisible) : true;

          const comment = await globalTicketService.addComment(
            ticketId,
            body.text,
            customerVisible,
            user,
          );

          return jsonResponse({ success: true, comment }, 201);
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

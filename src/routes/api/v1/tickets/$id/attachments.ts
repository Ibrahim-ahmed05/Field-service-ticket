import { errorResponse, extractAuthUser, jsonResponse } from "@/server/lib/apiHelper";
import { globalTicketService } from "@/server/services/ticketService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/tickets/$id/attachments")({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        try {
          const user = extractAuthUser(request);
          const ticketId = params["id"];
          const body = await request.json();

          if (!body.fileName || !body.fileType || !body.fileSize || !body.fileUrl) {
            return jsonResponse(
              {
                status: 400,
                code: "MISSING_ATTACHMENT_METADATA",
                message: "fileName, fileType, fileSize, and fileUrl are required.",
              },
              400,
            );
          }

          const customerVisible =
            body.customerVisible !== undefined ? Boolean(body.customerVisible) : true;

          const attachment = await globalTicketService.addAttachment(
            ticketId,
            body.fileName,
            body.fileType,
            Number(body.fileSize),
            body.fileUrl,
            customerVisible,
            user,
          );

          return jsonResponse({ success: true, attachment }, 201);
        } catch (err) {
          return errorResponse(err);
        }
      },
    },
  },
});

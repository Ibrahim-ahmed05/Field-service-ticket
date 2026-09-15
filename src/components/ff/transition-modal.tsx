import { useState } from "react";
import { useFieldFlow } from "@/lib/store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusBadge } from "@/components/ff/badges";
import { CheckCircle2, AlertCircle, PauseCircle, XCircle, ArrowRight, Camera } from "lucide-react";
import type { Ticket, TicketStatus } from "@/lib/fieldflow-data";

export function TransitionModal({
  ticket,
  targetStatus,
  open,
  onOpenChange,
}: {
  ticket: Ticket;
  targetStatus: TicketStatus | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateTicketStatus } = useFieldFlow();

  const [note, setNote] = useState("");
  const [reasonCategory, setReasonCategory] = useState("parts");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80");
  const [customerVisible, setCustomerVisible] = useState(true);
  const [photoTone, setPhotoTone] = useState<"before" | "issue" | "fix" | "after">("fix");

  if (!targetStatus) return null;

  const handleConfirm = async () => {
    let finalNote = note.trim();
    let evidencePayload = undefined;

    if (targetStatus === "Waiting" && !finalNote) {
      finalNote = reasonCategory === "parts"
        ? "Paused: Waiting for replacement components from supplier."
        : "Paused: Waiting on client facility access window.";
    } else if (targetStatus === "Rejected" && !finalNote) {
      finalNote = "Technician declined assignment due to specialized tooling / schedule conflict.";
    }

    if (targetStatus === "Resolved") {
      evidencePayload = {
        name: `${ticket.category.toLowerCase()}_completion_evidence.png`,
        url: photoUrl,
        customerVisible,
        tone: photoTone,
      };
    }

    const ok = await updateTicketStatus(ticket.id, targetStatus, finalNote || undefined, evidencePayload);
    if (ok) {
      onOpenChange(false);
      setNote("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {targetStatus === "Resolved" && <CheckCircle2 className="size-5 text-emerald-600" />}
            {targetStatus === "Waiting" && <PauseCircle className="size-5 text-purple-600" />}
            {targetStatus === "Rejected" && <XCircle className="size-5 text-red-600" />}
            {targetStatus === "Cancelled" && <AlertCircle className="size-5 text-rose-600" />}
            {targetStatus === "In Progress" && <ArrowRight className="size-5 text-blue-600" />}

            <DialogTitle className="text-base font-semibold">
              Transition to {targetStatus}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
            <span>Ticket: <strong>{ticket.id}</strong></span>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <StatusBadge status={ticket.status} />
              <ArrowRight className="size-3 text-muted-foreground" />
              <StatusBadge status={targetStatus} />
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Waiting options */}
          {targetStatus === "Waiting" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Reason for pausing work</Label>
              <RadioGroup value={reasonCategory} onValueChange={setReasonCategory} className="space-y-2">
                <div className="flex items-center space-x-2 border border-hairline p-2.5 rounded-lg bg-surface">
                  <RadioGroupItem value="parts" id="r-parts" />
                  <Label htmlFor="r-parts" className="text-xs font-normal cursor-pointer flex-1">
                    <strong>Awaiting Spare Parts:</strong> Components on order or backlogged.
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border border-hairline p-2.5 rounded-lg bg-surface">
                  <RadioGroupItem value="access" id="r-access" />
                  <Label htmlFor="r-access" className="text-xs font-normal cursor-pointer flex-1">
                    <strong>Awaiting Customer Access:</strong> Plant shutdown or security permit required.
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Resolved evidence upload */}
          {targetStatus === "Resolved" && (
            <div className="space-y-3 rounded-lg border border-hairline bg-surface p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Camera className="size-3.5 text-primary" />
                  Job Completion Evidence & Photo
                </span>
                <span className="text-[10px] text-muted-foreground">Photo visibility</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium">Evidence Photo URL</Label>
                <Input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Customer Visible</Label>
                  <p className="text-[10px] text-muted-foreground">Allow customer to view photo on tracking portal</p>
                </div>
                <Switch checked={customerVisible} onCheckedChange={setCustomerVisible} />
              </div>
            </div>
          )}

          {/* Notes or explanation */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {targetStatus === "Resolved"
                ? "Resolution Summary & Work Logged"
                : targetStatus === "Rejected"
                ? "Reason for declining assignment"
                : targetStatus === "Cancelled"
                ? "Cancellation Reason"
                : "Transition Note (Logged to Ticket History)"}
            </Label>
            <Textarea
              rows={3}
              placeholder={
                targetStatus === "Resolved"
                  ? "Describe corrective actions taken, baseline readings verified, and components serviced..."
                  : "Provide details for the audit trail..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            className={
              targetStatus === "Resolved"
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : targetStatus === "Rejected" || targetStatus === "Cancelled"
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-primary text-white"
            }
          >
            Confirm Status Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


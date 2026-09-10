import { useState, useEffect } from "react";
import { useFieldFlow } from "@/lib/store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit3, Clock, ShieldAlert, Plus, X } from "lucide-react";
import { allCategories, allPriorities, SLA_HOURS, type Category, type Priority, type Ticket } from "@/lib/fieldflow-data";

export function EditTicketModal({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { equipment, editTicket, role } = useFieldFlow();

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<Category>("Electrical");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [equipmentId, setEquipmentId] = useState<string>("none");
  const [workInstructionInput, setWorkInstructionInput] = useState<string>("");
  const [workInstructions, setWorkInstructions] = useState<string[]>([]);

  useEffect(() => {
    if (open && ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description);
      setCategory(ticket.category);
      setPriority(ticket.priority);
      setEquipmentId(ticket.equipmentId || "none");
      setWorkInstructions(ticket.workInstructions || []);
    }
  }, [open, ticket]);

  const availableEquipment = ticket.siteId ? equipment.filter((e) => e.siteId === ticket.siteId) : [];

  const addInstruction = () => {
    if (workInstructionInput.trim()) {
      setWorkInstructions([...workInstructions, workInstructionInput.trim()]);
      setWorkInstructionInput("");
    }
  };

  const removeInstruction = (idx: number) => {
    setWorkInstructions(workInstructions.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    editTicket(ticket.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      equipmentId: equipmentId !== "none" ? equipmentId : undefined,
      workInstructions,
    });

    onOpenChange(false);
  };

  const slaDuration = SLA_HOURS[priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Edit3 className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Edit Ticket #{ticket.id}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update ticket details, scope, target priority, and assigned equipment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Customer & Site readonly info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl border border-hairline bg-muted/40 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Customer Account</span>
              <span className="font-semibold text-foreground">{ticket.customerName}</span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block font-medium">Site Location</span>
              <span className="font-semibold text-foreground">{ticket.siteName}</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ticket Title / Summary *</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Inverter Overheating Alarm on Array 4"
              className="h-9 text-xs bg-background"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Detailed Issue Description *</Label>
            <Textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide symptoms, error codes, and field environment..."
              className="text-xs bg-background resize-none"
            />
          </div>

          {/* Category, Priority, Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority (SLA Target)</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {allPriorities.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Equipment Asset</Label>
              <Select value={equipmentId} onValueChange={setEquipmentId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">General / Unspecified</SelectItem>
                  {availableEquipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id} className="text-xs">
                      {eq.equipmentType} ({eq.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SLA Warning */}
          <div className="p-3 rounded-xl border border-hairline bg-surface flex items-center gap-3 text-xs">
            <Clock className="size-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">Target Response Time: {slaDuration} Hours</p>
              <p className="text-[11px] text-muted-foreground">
                Priority modification automatically updates target SLA resolution windows.
              </p>
            </div>
          </div>

          {/* Work Instructions Checklist */}
          <div className="space-y-2 pt-2 border-t border-hairline">
            <Label className="text-xs font-medium">Technician Tasks / Work Checklist</Label>
            <div className="flex gap-2">
              <Input
                value={workInstructionInput}
                onChange={(e) => setWorkInstructionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addInstruction();
                  }
                }}
                placeholder="e.g. Inspect breaker panel tightness and record voltage"
                className="h-8 text-xs bg-background flex-1"
              />
              <Button type="button" size="sm" onClick={addInstruction} variant="secondary" className="h-8 text-xs gap-1">
                <Plus className="size-3.5" /> Add Task
              </Button>
            </div>

            {workInstructions.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {workInstructions.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/60 text-xs">
                    <span className="text-foreground">{task}</span>
                    <button
                      type="button"
                      onClick={() => removeInstruction(idx)}
                      className="text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-hairline">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs bg-primary text-primary-foreground font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

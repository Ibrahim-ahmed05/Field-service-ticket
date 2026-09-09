import { useState, useEffect } from "react";
import { useFieldFlow } from "@/lib/store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Clock, ShieldAlert, Sparkles } from "lucide-react";
import { allCategories, allPriorities, SLA_HOURS, type Category, type Priority } from "@/lib/fieldflow-data";
import { useNavigate } from "@tanstack/react-router";

export function CreateTicketModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { customers, sites, equipment, technicians, createTicket, role, activeCustomerId } = useFieldFlow();
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [equipmentId, setEquipmentId] = useState<string>("none");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<Category>("Electrical");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>("unassigned");
  const [workInstructionInput, setWorkInstructionInput] = useState<string>("");
  const [workInstructions, setWorkInstructions] = useState<string[]>([]);

  // Initialize or filter customer based on role
  useEffect(() => {
    if (open) {
      const initialCust = role === "customer" ? activeCustomerId : customers[0]?.id || "";
      setCustomerId(initialCust);
      const custSites = sites.filter((s) => s.customerId === initialCust);
      const firstSite = custSites[0]?.id || "";
      setSiteId(firstSite);
      setEquipmentId("none");
      setTitle("");
      setDescription("");
      setCategory("Electrical");
      setPriority("Medium");
      setAssignedTechnicianId("unassigned");
      setWorkInstructions([]);
    }
  }, [open, role, activeCustomerId, customers, sites]);

  // When customer changes, update available sites
  const availableSites = sites.filter((s) => s.customerId === customerId);
  const availableEquipment = siteId ? equipment.filter((e) => e.siteId === siteId) : [];

  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const custSites = sites.filter((s) => s.customerId === newCustId);
    setSiteId(custSites[0]?.id || "");
    setEquipmentId("none");
  };

  const handleSiteChange = (newSiteId: string) => {
    setSiteId(newSiteId);
    setEquipmentId("none");
  };

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
    if (!customerId || !siteId || !title.trim() || !description.trim()) {
      return;
    }

    const newTicket = createTicket({
      customerId,
      siteId,
      equipmentId: equipmentId !== "none" ? equipmentId : undefined,
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      assignedTechnicianId: assignedTechnicianId !== "unassigned" ? assignedTechnicianId : null,
      workInstructions,
    });

    onOpenChange(false);
    navigate({ to: "/tickets/$ticketId", params: { ticketId: newTicket.id } });
  };

  const slaDuration = SLA_HOURS[priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Plus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {role === "customer" ? "Report Service Issue" : "Create New Service Ticket"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {role === "customer"
                  ? "Describe the issue at your site. A technician will be assigned promptly."
                  : "Dispatch a new field ticket, assign technician, and set priority SLA."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Customer and Site selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Customer Account</Label>
              {role === "customer" ? (
                <div className="h-9 px-3 rounded-md border border-hairline bg-muted flex items-center text-xs font-medium">
                  {customers.find((c) => c.id === customerId)?.name || "Current Customer"}
                </div>
              ) : (
                <Select value={customerId} onValueChange={handleCustomerChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Site Location</Label>
              <Select value={siteId} onValueChange={handleSiteChange} disabled={availableSites.length === 0}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {availableSites.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} ({s.siteType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Equipment selection (Optional per Architecture Doc) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Equipment Asset (Optional)</Label>
              <span className="text-[11px] text-muted-foreground">Tied to selected site</span>
            </div>
            <Select value={equipmentId} onValueChange={setEquipmentId} disabled={availableEquipment.length === 0}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={availableEquipment.length === 0 ? "No equipment registered for this site" : "Select equipment (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">None / General Site Issue</SelectItem>
                {availableEquipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id} className="text-xs">
                    {eq.model} — {eq.equipmentType} ({eq.serialNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Issue Title</Label>
            <Input
              required
              placeholder="e.g., Solar inverter producing low output or Chiller vibration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Problem Description</Label>
            <Textarea
              required
              rows={3}
              placeholder="Provide symptoms, error codes, site observations or recent triggers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as Category)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority & SLA Target</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as Priority)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allPriorities.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {p} (Target SLA: {SLA_HOURS[p]}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SLA Notification Banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200">
            <Clock className="size-4 shrink-0 text-blue-600" />
            <span>
              <strong>Target SLA Due Date:</strong>{" "}
              {slaDuration === 4 ? "4 hours from now" : `${slaDuration / 24} days from now`}. Overdue flags apply automatically if unresolved.
            </span>
          </div>

          {/* Assign Technician (Only for Managers per permission matrix) */}
          {role === "manager" && (
            <div className="space-y-1.5 pt-1 border-t border-hairline">
              <Label className="text-xs font-medium">Assign Field Technician (Optional)</Label>
              <Select value={assignedTechnicianId} onValueChange={setAssignedTechnicianId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Unassigned (Status will be 'New')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned" className="text-xs">
                    Leave Unassigned (Status: New)
                  </SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name} — {t.specialization} ({t.activeJobs} active jobs, {t.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Work Instructions Checklist */}
          {role === "manager" && (
            <div className="space-y-2 pt-1 border-t border-hairline">
              <Label className="text-xs font-medium">Technician Work Instructions (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Inspect combiner box, log multimeter reading..."
                  value={workInstructionInput}
                  onChange={(e) => setWorkInstructionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInstruction();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={addInstruction} className="h-8 text-xs">
                  Add
                </Button>
              </div>

              {workInstructions.length > 0 && (
                <ul className="space-y-1 mt-1">
                  {workInstructions.map((ins, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between px-2.5 py-1 bg-surface rounded border border-hairline text-xs"
                    >
                      <span className="font-mono text-muted-foreground mr-2">{idx + 1}.</span>
                      <span className="flex-1 truncate">{ins}</span>
                      <button
                        type="button"
                        onClick={() => removeInstruction(idx)}
                        className="text-muted-foreground hover:text-danger text-xs ml-2"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-hairline">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-primary text-primary-foreground font-medium">
              Create & Dispatch Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

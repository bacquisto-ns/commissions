import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface BrokerAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (brokerId: number) => void;
  brokers: any[];
  selectedCount: number;
}

export function BrokerAssignmentDialog({
  open,
  onOpenChange,
  onAssign,
  brokers,
  selectedCount,
}: BrokerAssignmentDialogProps) {
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");

  const handleAssign = () => {
    if (selectedBrokerId) {
      onAssign(Number(selectedBrokerId));
      onOpenChange(false);
      setSelectedBrokerId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" />
            Assign Broker to {selectedCount} Commissions
          </DialogTitle>
          <DialogDescription>
            Select a broker to assign to the selected commissions. This will update the broker
            association for all selected items.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedBrokerId} onValueChange={setSelectedBrokerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a broker" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Brokers</SelectLabel>
                <SelectItem value="0">No Broker/Unassigned</SelectItem>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id.toString()}>
                    {broker.firstName} {broker.lastName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedBrokerId}>
            Assign Broker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
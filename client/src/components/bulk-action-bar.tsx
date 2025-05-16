import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, AlertCircle } from "lucide-react";

interface BulkActionBarProps {
  selectedIds: number[];
  onApproveSelected: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({ 
  selectedIds, 
  onApproveSelected,
  onClearSelection
}: BulkActionBarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | undefined>(undefined);
  
  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    
    if (action === "approve") {
      setShowConfirmDialog(true);
    }
  };
  
  const handleConfirmAction = () => {
    if (selectedAction === "approve") {
      onApproveSelected();
    }
    
    setShowConfirmDialog(false);
    setSelectedAction(undefined);
  };
  
  if (selectedIds.length === 0) return null;
  
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedIds.length} commissions selected</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearSelection}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Select onValueChange={handleActionSelect}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Actions</SelectLabel>
                  <SelectItem value="approve">Mark as Approved</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => handleActionSelect("approve")}
              disabled={selectedIds.length === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Approve Selected
            </Button>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-warning" />
              Approve {selectedIds.length} Commissions
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedIds.length} commissions? 
              This will mark them all as approved and set their payment date to today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              Yes, Approve All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
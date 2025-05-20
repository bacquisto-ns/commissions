import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { CommissionStructureType } from '@/lib/commission-calculator';

interface CommissionTooltipProps {
  type: CommissionStructureType | string;
  children?: React.ReactNode;
  className?: string;
}

// Define descriptions for each commission calculation type
export const COMMISSION_TYPE_DESCRIPTIONS = {
  [CommissionStructureType.FLAT_RATE]: {
    title: "Flat Rate",
    description: "A fixed amount paid regardless of the number of participants or transaction value.",
    formula: "Commission = Flat Rate Amount",
    example: "If the flat rate is $100, the commission will be $100 regardless of the number of participants."
  },
  [CommissionStructureType.PER_PARTICIPANT]: {
    title: "Per Participant",
    description: "A fixed amount per participant enrolled in the benefit program.",
    formula: "Commission = Rate × Number of Participants",
    example: "If the rate is $2 per participant and there are 50 participants, the commission will be $2 × 50 = $100."
  },
  [CommissionStructureType.TIERED_PARTICIPANT]: {
    title: "Tiered Participant",
    description: "Different rates applied based on participant count tiers.",
    formula: "Commission = Tier Rate × Number of Participants",
    example: "If tier 1 is $3/participant for 1-100 participants, and tier 2 is $2/participant for 101+ participants, then a group with 150 participants would receive $2 × 150 = $300."
  },
  [CommissionStructureType.PERCENTAGE]: {
    title: "Percentage",
    description: "A percentage of the total transaction value.",
    formula: "Commission = Percentage × Transaction Value",
    example: "If the percentage is 3% and the transaction value is $10,000, the commission will be 3% × $10,000 = $300."
  },
  // Product-specific rates
  "FSA": {
    title: "FSA Commission",
    description: "Flexible Spending Account commissions are typically calculated per participant.",
    formula: "Commission = Rate × Number of Participants",
    example: "Standard rate of $2.00 per participant. For 100 participants, commission is $2.00 × 100 = $200."
  },
  "HSA": {
    title: "HSA Commission",
    description: "Health Savings Account commissions are typically calculated per participant.",
    formula: "Commission = Rate × Number of Participants",
    example: "Standard rate of $2.50 per participant. For 100 participants, commission is $2.50 × 100 = $250."
  },
  "COBRA": {
    title: "COBRA Commission",
    description: "COBRA administration commissions are typically lower per participant.",
    formula: "Commission = Rate × Number of Participants",
    example: "Standard rate of $0.75 per participant. For 100 participants, commission is $0.75 × 100 = $75."
  },
  "HRA": {
    title: "HRA Commission",
    description: "Health Reimbursement Arrangement commissions are typically calculated per participant.",
    formula: "Commission = Rate × Number of Participants",
    example: "Standard rate of $2.25 per participant. For 100 participants, commission is $2.25 × 100 = $225."
  },
  "Consolidated Billing": {
    title: "Consolidated Billing Commission",
    description: "Consolidated Billing services often use a flat rate or percentage basis.",
    formula: "Commission = Percentage × Invoice Amount or Flat Fee",
    example: "3% of total invoice amount or a flat fee of $150 per billing cycle."
  }
};

/**
 * A component that displays a tooltip with information about commission calculation methods
 */
export function CommissionInfoTooltip({ type, children, className = "" }: CommissionTooltipProps) {
  // Use type assertion to fix TypeScript error with string indexing
  const commissionDescriptions = COMMISSION_TYPE_DESCRIPTIONS as {
    [key: string]: {
      title: string;
      description: string;
      formula: string;
      example: string;
    }
  };
  const typeInfo = commissionDescriptions[type] || {
    title: "Commission Information",
    description: "Information about this commission structure is not available.",
    formula: "N/A",
    example: "N/A"
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center cursor-help ${className}`}>
            {children || <HelpCircle className="h-4 w-4 text-muted-foreground ml-1" />}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-md p-4" side="right">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{typeInfo.title}</h4>
            <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
            <div className="mt-2">
              <p className="text-xs font-medium">Formula:</p>
              <p className="text-xs bg-muted p-1 rounded">{typeInfo.formula}</p>
            </div>
            <div className="mt-1">
              <p className="text-xs font-medium">Example:</p>
              <p className="text-xs">{typeInfo.example}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A component that explains the commission calculation method for a specific product type
 */
export function ProductCommissionTooltip({ productType, children, className = "" }: { productType: string, children?: React.ReactNode, className?: string }) {
  // Map product type to the appropriate commission type
  const type = productType || "PER_PARTICIPANT";
  
  return <CommissionInfoTooltip type={type} children={children} className={className} />;
}
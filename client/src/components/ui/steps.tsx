import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

interface StepsProps {
  children: ReactNode;
  currentStep: number;
  className?: string;
}

interface StepProps {
  title: string;
  description?: string;
}

export function Steps({ children, currentStep, className }: StepsProps) {
  // Convert children to array for proper handling
  const childrenArray = Array.isArray(children) ? children : [children];
  
  return (
    <div className={cn("flex flex-col sm:flex-row w-full", className)}>
      {childrenArray.map((child, index) => {
        // Clone the child with additional props
        const stepNumber = index + 1;
        const status = 
          currentStep > stepNumber 
            ? "completed" 
            : currentStep === stepNumber
              ? "current"
              : "upcoming";
              
        // Add props to the child
        return (
          <div 
            key={index} 
            className={cn(
              "flex flex-1 items-center gap-2 sm:flex-col sm:items-start",
              index < childrenArray.length - 1 && "mb-4 sm:mb-0",
              // For horizontal layout, add connecting lines
              index < childrenArray.length - 1 && "sm:after:content-[''] sm:after:w-full sm:after:h-[1px] sm:after:border-b sm:after:border-gray-200 sm:after:mt-4"
            )}
          >
            {/* Step indicator */}
            <div className="flex-shrink-0 flex items-center justify-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                  status === "completed" && "bg-primary text-primary-foreground",
                  status === "current" && "bg-primary text-primary-foreground",
                  status === "upcoming" && "bg-muted text-muted-foreground"
                )}
              >
                {status === "completed" ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
            </div>
            
            {/* Clone the child with additional props */}
            {React.isValidElement(child) 
              ? React.cloneElement(child, {
                  status,
                  stepNumber,
                })
              : child}
          </div>
        );
      })}
    </div>
  );
}

export function Step({ title, description, status }: StepProps & { status?: string; stepNumber?: number; [key: string]: any }) {
  return (
    <div className="flex flex-col sm:mt-3">
      <span 
        className={cn(
          "text-sm font-medium",
          status === "completed" && "text-primary",
          status === "current" && "text-primary",
          status === "upcoming" && "text-muted-foreground"
        )}
      >
        {title}
      </span>
      
      {description && (
        <span className="text-xs text-muted-foreground">
          {description}
        </span>
      )}
    </div>
  );
}
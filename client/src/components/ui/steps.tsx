import React from 'react';
import { cn } from '@/lib/utils';

interface StepsProps {
  current: number;
  children: React.ReactNode;
  className?: string;
}

interface StepProps {
  title: string;
  description?: string;
  className?: string;
}

export function Steps({ current, children, className }: StepsProps) {
  const childrenArray = React.Children.toArray(children).filter(Boolean);
  const totalSteps = childrenArray.length;

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center">
        {childrenArray.map((child, index) => {
          const isActive = index === current;
          const isCompleted = index < current;
          const isLast = index === totalSteps - 1;

          // Clone the child element and add props
          if (React.isValidElement(child)) {
            const childElement = child as React.ReactElement<StepProps>;
            const stepNumber = index + 1;

            return (
              <React.Fragment key={index.toString()}>
                <div className="flex items-center relative">
                  {/* Step circle */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border transition-colors',
                      isActive && 'bg-primary text-white border-primary',
                      isCompleted && 'bg-primary text-white border-primary',
                      !isActive && !isCompleted && 'bg-gray-100 text-gray-500 border-gray-300'
                    )}
                  >
                    {stepNumber}
                  </div>

                  {/* Step content */}
                  <div className="ml-3">
                    <div
                      className={cn(
                        'text-sm font-medium',
                        isActive && 'text-gray-900',
                        isCompleted && 'text-gray-900',
                        !isActive && !isCompleted && 'text-gray-500'
                      )}
                    >
                      {childElement.props.title}
                    </div>
                    {childElement.props.description && (
                      <div className="text-xs text-gray-500">
                        {childElement.props.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector line between steps */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      isCompleted ? 'bg-primary' : 'bg-gray-300'
                    )}
                  />
                )}
              </React.Fragment>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export function Step({ title, description, className }: StepProps) {
  return null; // This is a dummy component, actual rendering is handled by Steps
}
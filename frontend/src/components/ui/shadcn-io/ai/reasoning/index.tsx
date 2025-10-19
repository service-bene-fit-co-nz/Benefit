import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export const Reasoning = ({ children, isStreaming, defaultOpen: initialOpen = false, className }: { children: React.ReactNode; isStreaming?: boolean; defaultOpen?: boolean; className?: string }) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className={cn("border p-2 rounded-md", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === ReasoningTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, { onClick: () => setIsOpen(!isOpen), isOpen });
        }
        if (React.isValidElement(child) && child.type === ReasoningContent) {
          return isOpen ? child : null;
        }
        return child;
      })}
    </div>
  );
};

export const ReasoningTrigger = ({ onClick, isOpen, children, className }: { onClick?: () => void; isOpen?: boolean; children?: React.ReactNode; className?: string }) => (
  <button type="button" onClick={onClick} className={cn("text-blue-500 hover:underline", className)}>{children || (isOpen ? 'Hide Reasoning' : 'Show Reasoning')}</button>
);

export const ReasoningContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mt-2 text-sm text-muted-foreground", className)}>{children}</div>
);

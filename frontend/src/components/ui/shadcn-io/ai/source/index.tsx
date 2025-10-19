import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export const Source = ({ href, title, className }: { href: string; title: string; className?: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={cn("text-blue-500 underline", className)}>{title}</a>
);

export const Sources = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("border p-2 rounded-md", className)}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SourcesTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, { onClick: () => setIsOpen(!isOpen), isOpen });
        }
        if (React.isValidElement(child) && child.type === SourcesContent) {
          return isOpen ? child : null;
        }
        return child;
      })}
    </div>
  );
};

export const SourcesContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mt-2 text-sm text-muted-foreground", className)}>{children}</div>
);

export const SourcesTrigger = ({ count, onClick, isOpen, children, className }: { count: number; onClick?: () => void; isOpen?: boolean; children?: React.ReactNode; className?: string }) => (
  <button type="button" onClick={onClick} className={cn("text-blue-500 hover:underline", className)}>{children || (isOpen ? 'Hide ' : 'Show ' )}{count} Sources</button>
);

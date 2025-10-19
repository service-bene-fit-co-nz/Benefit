import React from 'react';
import { cn } from '@/lib/utils';

export const Message = ({ children, from, className }: { children: React.ReactNode; from: 'user' | 'assistant'; className?: string }) => (
  <div className={cn("flex items-start gap-4", from === 'user' ? 'justify-end' : 'justify-start', className)}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child) && child.type === MessageContent) {
        return React.cloneElement(child as React.ReactElement<any>, { from });
      }
      return child;
    })}
  </div>
);

export const MessageAvatar = ({ src, name, className }: { src: string; name: string; className?: string }) => (
  <img src={src} alt={name} className={cn("w-8 h-8 rounded-full", className)} />
);

export const MessageContent = ({ children, from, className }: { children: React.ReactNode; from: 'user' | 'assistant'; className?: string }) => (
  <div className={cn("p-3 rounded-lg max-w-[70%]", className, {
    'bg-primary text-primary-foreground': from === 'user',
    'bg-muted': from === 'assistant',
  })}>{children}</div>
);

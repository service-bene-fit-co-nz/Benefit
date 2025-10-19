import React from 'react';
import { cn } from '@/lib/utils';

export const Conversation = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col flex-1 overflow-y-auto", className)}>{children}</div>
);

export const ConversationContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex flex-col p-4", className)}>{children}</div>
);

export const ConversationScrollButton = () => (
  <button className="absolute bottom-4 right-4 p-2 bg-blue-500 text-white rounded-full shadow-lg">Scroll Down</button>
);
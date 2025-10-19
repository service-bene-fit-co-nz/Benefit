import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PromptInput = ({ children, onSubmit, className }: { children: React.ReactNode; onSubmit: (e: React.FormEvent<HTMLFormElement>) => void; className?: string }) => (
  <form onSubmit={onSubmit} className={cn("flex flex-col gap-2", className)}>{children}</form>
);

export const PromptInputTextarea = ({ value, onChange, placeholder, disabled, className }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; disabled?: boolean; className?: string }) => (
  <textarea value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className={cn("w-full p-2 border rounded-md resize-none", className)}></textarea>
);

export const PromptInputToolbar = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex justify-between items-center mt-2", className)}>{children}</div>
);

export const PromptInputTools = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("flex gap-2", className)}>{children}</div>
);

export const PromptInputButton = ({ children, disabled, className }: { children: React.ReactNode; disabled?: boolean; className?: string }) => (
  <Button type="button" disabled={disabled} className={cn("p-2 border rounded-md", className)}>{children}</Button>
);

export const PromptInputModelSelect = ({ children, value, onValueChange, disabled, className }: { children: React.ReactNode; value: string; onValueChange: (value: string) => void; disabled?: boolean; className?: string }) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    {children}
  </Select>
);

export const PromptInputModelSelectTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <SelectTrigger className={cn("p-2", className)}>{children}</SelectTrigger>
);

export const PromptInputModelSelectValue = ({ className }: { className?: string }) => (
  <SelectValue className={cn("", className)} />
);

export const PromptInputModelSelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <SelectContent className={cn("", className)}>{children}</SelectContent>
);

export const PromptInputModelSelectItem = ({ children, value, className }: { children: React.ReactNode; value: string; className?: string }) => (
  <SelectItem value={value} className={cn("", className)}>{children}</SelectItem>
);

export const PromptInputSubmit = ({ disabled, status, children, className }: { disabled?: boolean; status?: 'streaming' | 'ready'; children?: React.ReactNode; className?: string }) => (
  <Button type="submit" disabled={disabled} className={cn("p-2 bg-blue-500 text-white rounded-md", className)}>{children || (status === 'streaming' ? 'Streaming...' : 'Send')}</Button>
);
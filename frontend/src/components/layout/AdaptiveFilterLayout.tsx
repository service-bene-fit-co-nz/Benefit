'use client';

import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface AdaptiveFilterLayoutProps {
  Header: React.ReactNode;
  MainContent: React.ReactNode;
  FilterPanel: React.ReactNode;
}

export function AdaptiveFilterLayout({
  Header,
  MainContent,
  FilterPanel,
}: AdaptiveFilterLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          {Header}
        </div>
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="adaptive-admin-filter-v1"
          className="flex-1"
        >
          <ResizablePanel defaultSize={75} minSize={50}>
            <div className="h-full p-4">{MainContent}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={15} maxSize={50}>
            <ScrollArea className="h-full p-4">{FilterPanel}</ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
       <div className="py-4 pl-4 pr-1 border-b flex justify-between items-center">
        <div>{Header}</div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0">
            <SheetHeader className="p-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100%-4rem)] p-2">
              {FilterPanel}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex-1 p-4">{MainContent}</div>
    </div>
  );
}

"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

// 1. Collapsible (Root)
// Use forwardRef to receive the ref and pass it to CollapsiblePrimitive.Root
const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>, // Type of the element the ref points to (usually a <div>)
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> // Props, but exclude 'ref'
>(({ ...props }, ref) => {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      ref={ref} // Pass the forwarded ref
      {...props}
    />
  );
});
Collapsible.displayName = CollapsiblePrimitive.Root.displayName;

// 2. CollapsibleTrigger
const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ ...props }, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      ref={ref} // Pass the forwarded ref
      {...props}
    />
  );
});
CollapsibleTrigger.displayName =
  CollapsiblePrimitive.CollapsibleTrigger.displayName;

// 3. CollapsibleContent
const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ ...props }, ref) => {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      ref={ref} // Pass the forwarded ref
      {...props}
    />
  );
});
CollapsibleContent.displayName =
  CollapsiblePrimitive.CollapsibleContent.displayName;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };

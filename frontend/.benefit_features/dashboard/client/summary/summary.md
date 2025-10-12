Goal
Generate a reusable, responsive container component that handles the main content and a right-hand filter panel. This component must be designed to fit adjacently to an existing, fixed-width Left Navigation Sidebar. The solution must prevent Next.js hydration mismatches.

Implementation Details
Context: The component must assume it is placed inside a container that handles the overall h-screen and a fixed-width external Left Navigation. The component itself will manage its full available height (h-full) and remaining width (flex-1).

Assumed Parent Structure: <div className="flex h-screen"><nav className="w-[200px]">...</nav><div className="flex-1"> **<AdaptiveFilterLayout />** </div></div>

Breakpoints and Logic: The mobile/desktop switch must happen at the Tailwind CSS lg breakpoint (1024px).

use-media-query.ts Hook: Create a client component hook to safely check the lg breakpoint. It must return false during the server render phase to prevent hydration errors.

AdaptiveFilterLayout.tsx Component: (The new reusable component)

It must be a Client Component ('use client').

It accepts three generic props: Header, MainContent, and FilterPanel (ReactNode).

Structure: Use a vertical flex column (flex flex-col h-full) to contain a fixed Header and the dynamic content area (flex-1).

Desktop View (≥1024px): Use ResizablePanelGroup (horizontal direction) to split the space below the header.

Left Panel (Main): MainContent (default size 75, min 50).

Right Panel (Filter): FilterPanel (default size 25, min 15, max 35).

Use a persistent autoSaveId ("adaptive-admin-filter-v1").

Mobile View (<1024px):

Display the MainContent directly below the header.

Use a Sheet component, triggered by a button in the header, to render the FilterPanel. The sheet must be placed on the right side (side="right"). The trigger button should be placed within the Header.

Styling & Scrolling: The content areas within the main content and filter panel must use ScrollArea to manage local vertical scrolling, ensuring the rest of the layout remains fixed.

Prompt Output Request
Generate the code for the following three parts:

components/hooks/use-media-query.ts

components/layout/AdaptiveFilterLayout.tsx

A brief example of how to use AdaptiveFilterLayout.tsx within a page.tsx.

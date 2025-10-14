import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Users,
  HeartPulse,
  Activity,
  Mail,
  FileText,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  ListFilter,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Combobox } from "@/components/ui/combobox";
import { useQuery } from "@tanstack/react-query";
import { fetchClientsForTrainer } from "@/server-actions/trainer/clients/actions";
import {
  fetchClientForms,
  ClientForm,
} from "@/server-actions/client/notes/actions";
import { toast } from "sonner";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to format date
const formatDate = (dateString: string | Date | undefined | null) => {
  if (!dateString) {
    return ""; // Or a default like "N/A" or "-"
  }

  let date: Date;
  if (typeof dateString === "string") {
    // Replace space with 'T' to make it a valid ISO 8601 string for robust parsing
    date = new Date(dateString.replace(" ", "T"));
  } else {
    date = dateString;
  }

  if (isNaN(date.getTime())) {
    return "Invalid-Date"; // Handle invalid date cases
  }

  return date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
};

// --- Data Structures and Dummy Data ---

interface DataItem {
  id: string;
  name: string;
}

function isClientForm(item: DataItem | ClientForm): item is ClientForm {
  return (item as ClientForm).formUniqueName !== undefined;
}

interface ProgramItem {
  value: string;
  label: string;
}

const allClients: DataItem[] = [
  { id: "c1", name: "Brent Edwards" },
  { id: "c2", name: "Jane Doe" },
  { id: "c3", name: "John Smith" },
  { id: "c4", name: "Alice Johnson" },
  { id: "c5", name: "Bob Williams" },
  { id: "c6", name: "Charlie Brown" },
  { id: "c7", name: "Diana Prince" },
  { id: "c8", name: "Bruce Wayne" },
];

const dummyHabits: DataItem[] = [
  { id: "h1", name: "Drink 8 glasses of water" },
  { id: "h2", name: "Walk 10,000 steps" },
  { id: "h3", name: "Read for 15 minutes" },
];

const dummyFitness: DataItem[] = [
  { id: "f1", name: "Morning Run" },
  { id: "f2", name: "Yoga Session" },
];

const dummyEmails: DataItem[] = [
  { id: "e1", name: "Welcome Email" },
  { id: "e2", name: "Weekly Check-in" },
];

const dummyNotes: DataItem[] = [
  { id: "n1", name: "Initial Consultation Notes" },
  { id: "n2", name: "Follow-up call" },
];

const dummyPrograms: ProgramItem[] = [
  { value: "program-a", label: "Program A" },
  { value: "program-b", label: "Program B" },
  { value: "program-c", label: "Program C" },
];

interface FilterCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  data?: DataItem[] | ClientForm[]; // Allow ClientForm[] for forms
}

const filterCategories: FilterCategory[] = [
  { id: "clients", title: "Clients", icon: Users }, // No dummy data here
  { id: "habits", title: "Habits", icon: HeartPulse, data: dummyHabits },
  {
    id: "fitness-tracker",
    title: "Fitness Tracker",
    icon: Activity,
    data: dummyFitness,
  },
  { id: "email", title: "Email", icon: Mail, data: dummyEmails },
  { id: "notes", title: "Notes", icon: FileText, data: dummyNotes },
  { id: "forms", title: "Forms", icon: ClipboardList }, // No dummy data here, will be fetched
];

// --- Component ---

export const SummaryFilterPanel = () => {
  const [searchText, setSearchText] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(["clients"]);
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: string | null;
  }>({});
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>(
    undefined
  );

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const {
    data: fetchedClients = [],
    error: fetchClientsError,
    isLoading: isClientsLoading,
  } = useQuery({
    queryKey: ["clientsForTrainer", searchText, selectedProgram],
    queryFn: () =>
      fetchClientsForTrainer(searchText, selectedProgram || undefined),
  });

  const selectedClientId = selectedItems["clients"];

  const {
    data: fetchedForms = [],
    error: fetchFormsError,
    isLoading: isFormsLoading,
  } = useQuery({
    queryKey: ["clientForms", selectedClientId],
    queryFn: () => fetchClientForms(selectedClientId || ""),
    enabled: !!selectedClientId, // Only run query if a client is selected
  });

  useEffect(() => {
    if (fetchClientsError) {
      console.error("Failed to fetch clients:", fetchClientsError);
      toast.error("Failed to load clients", {
        description: "Could not retrieve client list.",
      });
    }
  }, [fetchClientsError]);

  useEffect(() => {
    if (fetchFormsError) {
      console.error("Failed to fetch forms:", fetchFormsError);
      toast.error("Failed to load forms", {
        description: "Could not retrieve client forms.",
      });
    }
  }, [fetchFormsError]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleItemSelect = (categoryId: string, itemId: string | null) => {
    setSelectedItems((prev) => ({
      ...prev,
      [categoryId]: itemId,
    }));
  };

  const renderSectionContent = (category: FilterCategory) => {
    let itemsToRender: DataItem[] | ClientForm[] = [];
    let isLoading = false;

    if (category.id === "clients") {
      itemsToRender = fetchedClients;
      isLoading = isClientsLoading;
    } else if (category.id === "forms") {
      itemsToRender = fetchedForms;
      isLoading = isFormsLoading;
    } else {
      itemsToRender = category.data || [];
    }

    const selectedId = selectedItems[category.id];

    if (isLoading) {
      return (
        <div className="p-1 text-muted-foreground">
          Loading {category.title.toLowerCase()}...
        </div>
      );
    }

    return (
      <div className="max-h-48 overflow-y-auto">
        {/* Add New item */}
        {category.id !== "clients" && (
          <div
            onClick={() => console.log("Add new for", category.id)}
            className="flex items-center cursor-pointer p-1 rounded hover:bg-accent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </div>
        )}

        {/* Data items */}
        {itemsToRender && itemsToRender.length > 0 ? (
          itemsToRender.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => handleItemSelect(category.id, item.id)}
                  className={`cursor-pointer p-1 rounded hover:bg-accent ${
                    selectedId === item.id ? "bg-accent" : ""
                  }`}
                >
                  {/* Display formUniqueName for forms, otherwise name */}
                  {isClientForm(item)
                    ? `${item.formUniqueName} (${formatDate(item.updatedAt)})`
                    : category.id === "clients"
                    ? `${item.name} (${(item as ClientForTrainer).email})`
                    : item.name}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isClientForm(item)
                    ? item.formUniqueName
                    : category.id === "clients"
                    ? `${item.name} (${(item as ClientForTrainer).email})`
                    : item.name}
                </p>
              </TooltipContent>
            </Tooltip>
          ))
        ) : (
          <div className="p-1 text-muted-foreground">
            No {category.title.toLowerCase()} found.
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="h-full bg-card text-card-foreground p-2 space-y-1">
        {isDesktop && (
          <h2 className="text-lg font-medium mb-4 px-2">Summary Filter</h2>
        )}

        {isDesktop && (
          <div className="py-1">
            <div className="flex items-center gap-2 mb-2">
              <ListFilter className="size-4" />
              <h3 className="font-medium text-sm">Filter by Program</h3>
            </div>
            <Combobox
              options={dummyPrograms}
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              placeholder="Select a program..."
              className="w-full"
            />
          </div>
        )}

        {/* Search Section */}
        <div className="py-1">
          {isDesktop && (
            <div className="flex items-center gap-2 mb-2">
              <Search className="size-4" />
              <h3 className="font-medium text-sm">Search</h3>
            </div>
          )}
          <input
            type="text"
            placeholder="Filter clients by name..."
            className="w-full p-2 border border-border rounded-md text-sm bg-transparent"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Collapsible Sections */}
        {filterCategories.map((category) => {
          const isOpen = openSections.includes(category.id);
          const Icon = category.icon;
          return (
            <div key={category.id}>
              <div
                onClick={() => toggleSection(category.id)}
                className="w-full flex items-center justify-start py-2 cursor-pointer rounded-md hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  <Icon className="size-4" />
                  <h3 className="font-medium text-sm">{category.title}</h3>
                </div>
              </div>
              {isOpen && (
                <div className="text-sm relative before:absolute before:left-2 before:h-full before:w-px before:bg-muted-foreground/20 before:content-['']">
                  <div className="pl-8 py-1">
                    {renderSectionContent(category)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

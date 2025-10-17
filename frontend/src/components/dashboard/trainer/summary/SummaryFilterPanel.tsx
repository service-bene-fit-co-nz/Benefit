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
  Trash2,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Combobox } from "@/components/ui/combobox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  fetchClientsForTrainer,
  ClientForTrainer,
} from "@/server-actions/trainer/clients/actions";
import { fetchClientNotes, ClientNote, createClientNote, deleteClientNote } from "@/server-actions/client/notes/actions";
import { toast } from "sonner";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate_DD_Mmm_YYYY } from "@/utils/date-utils";
import { ClientNoteType } from "@prisma/client";
import { AddNoteForm, NoteFormValues } from "./AddNoteForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- Helper Functions ---
function isClientContext(item: any): item is ClientContext {
  return (
    (item as ClientContext).name !== undefined &&
    (item as ClientContext).email !== undefined
  );
}

function isClientNote(item: any): item is ClientNote {
  return (item as ClientNote).noteType !== undefined;
}

const getClientNoteDisplayName = (note: ClientNote): string => {
  const metadata = note.noteMetadata as any;
  const formattedDate = formatDate_DD_Mmm_YYYY(new Date(note.updatedAt));
  switch (note.noteType) {
    case "ClientForm":
      const formName = metadata?.formUniqueName || "Form";
      return `${formName} (${formattedDate})`;
    case "AINote":
    case "TrainerNote":
    case "ClientNote":
      const author = metadata?.author || "Note";
      const noteTypeString = note.noteType.replace("Note", "");
      return `${author} (${noteTypeString}, ${formattedDate})`
    case "ClientEmail":
      return metadata?.subject || "Email";
    case "FitnessTrackerEntry":
      return metadata?.activity || "Fitness Entry";
    case "HabitEntry":
      return metadata?.habit || "Habit Entry";
    default:
      return "Entry";
  }
};

// --- Data Structures and Dummy Data ---
interface ProgramItem {
  value: string;
  label: string;
}

interface ClientContext {
  id: string;
  name: string;
  email: string;
  updatedAt: Date | undefined;
}

interface ContextSection {
  id: string;
  title: string;
  icon: React.ElementType;
  data?: ClientContext[] | ClientNote[];
  showAddNew: boolean;
}

const filterCategories: ContextSection[] = [
  { id: "clients", title: "Clients", icon: Users, data: [], showAddNew: false },
  {
    id: "habits",
    title: "Habits",
    icon: HeartPulse,
    data: [],
    showAddNew: true,
  },
  {
    id: "fitness-tracker",
    title: "Fitness Tracker",
    icon: Activity,
    data: [],
    showAddNew: true,
  },
  { id: "notes", title: "Notes", icon: FileText, data: [], showAddNew: true },
  { id: "email", title: "Email", icon: Mail, data: [], showAddNew: false },
  {
    id: "forms",
    title: "Forms",
    icon: ClipboardList,
    data: [],
    showAddNew: false,
  },
];

interface SummaryFilterPanelProps {
  addBadge: (badgeText: string) => void;
  onClientSelect: (client: ClientForTrainer | undefined) => void;
  clearClientSelection: () => void;
  selectedClient?: ClientForTrainer; // Add selectedClient to props
}

export const SummaryFilterPanel = ({
  addBadge,
  onClientSelect,
  clearClientSelection,
  selectedClient,
}: SummaryFilterPanelProps) => {
  // ------------------------------ State Management ------------------------------
  const [searchText, setSearchText] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(["clients"]);
  // selectedItems will now primarily manage non-client selections, and client selection will be derived
  const [selectedItems, setSelectedItems] = useState<{
    [key: string]: string | null;
  }>({});
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>(
    undefined
  );
  const [manuallySelectedClientId, setManuallySelectedClientId] = useState<
    string | null
  >(null);
  const [isAddNoteFormOpen, setIsAddNoteFormOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const queryClient = useQueryClient();

  // ------------------------------ Data Fetching ------------------------------
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
    data: fetchedNotes = [],
    error: fetchNotesError,
    isLoading: isNotesLoading,
  } = useQuery({
    queryKey: ["clientNotes", selectedClientId],
    queryFn: () => fetchClientNotes(selectedClientId || ""),
    enabled: !!selectedClientId, // Only run query if a client is selected
  });

  console.log("fetchedNotes:", fetchedNotes);

  const { data: session } = useSession();
  const loggedInUserName = session?.user?.name || "Unknown Trainer";

  const selectedClientData = fetchedClients.find(
    (client) => client.id === selectedItems["clients"]
  );
  const selectedClientName = selectedClientData?.name || "Unknown Client";

  const onAddNoteSubmit = async (values: NoteFormValues) => {
    if (!selectedClientId) {
      toast.error("No client selected", {
        description: "Please select a client before adding a note.",
      });
      return;
    }

    let authorName: string;
    switch (values.noteType) {
      case ClientNoteType.AINote:
      case ClientNoteType.TrainerNote:
        authorName = loggedInUserName;
        break;
      case ClientNoteType.ClientNote:
        authorName = selectedClientName;
        break;
      default:
        authorName = "Unknown";
    }

    try {
      await createClientNote(
        selectedClientId,
        values.note,
        values.noteType,
        { author: authorName, title: values.note.substring(0, 50) + "..." } // Use first 50 chars as title
      );
      toast.success("Note added successfully!");
      setIsAddNoteFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["clientNotes", selectedClientId] });
    } catch (error) {
      toast.error("Failed to add note", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  const onAddNoteCancel = () => {
    setIsAddNoteFormOpen(false);
  };

  const onDeleteNote = async (noteId: string) => {
    try {
      await deleteClientNote(noteId);
      toast.success("Note deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["clientNotes", selectedClientId] });
    } catch (error) {
      toast.error("Failed to delete note", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      });
    }
  };

  // ------------------------------ Effects and Handlers ------------------------------
  // useEffect(() => {
  //   if (fetchClientsError) {
  //     console.error("Failed to fetch clients:", fetchClientsError);
  //     toast.error("Failed to load clients", {
  //       description: "Could not retrieve client list.",
  //     });
  //   }
  // }, [fetchClientsError]);

  // useEffect(() => {
  //   if (fetchNotesError) {
  //     console.error("Failed to fetch notes:", fetchNotesError);
  //     toast.error("Failed to load notes", {
  //       description: "Could not retrieve client notes.",
  //     });
  //   }
  // }, [fetchNotesError]);

  useEffect(() => {
    if (searchText) {
      if (fetchedClients.length > 0) {
        if (
          !manuallySelectedClientId ||
          !fetchedClients.some(
            (client) => client.id === manuallySelectedClientId
          )
        ) {
          onClientSelect(fetchedClients[0]);
          handleItemSelect("clients", fetchedClients[0].id);
          setManuallySelectedClientId(null);
        }
      }
    }
  }, [
    fetchedClients,
    searchText,
    onClientSelect,
    selectedClient,
    manuallySelectedClientId,
  ]);

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

  const renderSectionContent = (category: ContextSection) => {
    let itemsToRender: (ClientContext | ClientNote)[] = [];
    let isLoading = false;

    if (category.id === "clients") {
      itemsToRender = fetchedClients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        updatedAt: undefined,
      }));
      isLoading = isClientsLoading;
    } else if (category.id === "forms") {
      //console.log("Fetched Notes for Forms:", fetchedNotes);
      itemsToRender = fetchedNotes.filter(
        (note) => note.noteType === ClientNoteType.ClientForm
      );
      isLoading = isNotesLoading;
    } else if (category.id === "notes") {
      const noteTypesForNotesSection: ClientNoteType[] = [
        ClientNoteType.AINote,
        ClientNoteType.TrainerNote,
        ClientNoteType.ClientNote,
      ];
      itemsToRender = fetchedNotes.filter((note) =>
        noteTypesForNotesSection.includes(note.noteType)
      );
      isLoading = isNotesLoading;
    } else if (category.id === "email") {
      itemsToRender = fetchedNotes.filter(
        (note) => note.noteType === ClientNoteType.ClientEmail
      );
      isLoading = isNotesLoading;
    } else if (category.id === "fitness-tracker") {
      itemsToRender = fetchedNotes.filter(
        (note) => note.noteType === ClientNoteType.FitnessTrackerEntry
      );
      isLoading = isNotesLoading;
    } else if (category.id === "habits") {
      itemsToRender = fetchedNotes.filter(
        (note) => note.noteType === ClientNoteType.HabitEntry
      );
      isLoading = isNotesLoading;
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
        {category.showAddNew && category.id === "notes" && !!selectedClientId && (
          <Dialog open={isAddNoteFormOpen} onOpenChange={setIsAddNoteFormOpen}>
            <DialogTrigger asChild>
              <div
                className="flex items-center cursor-pointer p-1 rounded hover:bg-accent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Note</DialogTitle>
                <DialogDescription>
                  Add a new note for the selected client.
                </DialogDescription>
              </DialogHeader>
              <AddNoteForm
                onSubmit={onAddNoteSubmit}
                onCancel={onAddNoteCancel}
                isSubmitting={false} // You might want to manage this state
                selectedClientName={selectedClientName}
                loggedInUserName={loggedInUserName}
              />
            </DialogContent>
          </Dialog>
        )}

        {itemsToRender.length > 0 ? (
          itemsToRender.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => {
                    if (category.id === "clients") {
                      const selectedClientData = fetchedClients.find(
                        (client) => client.id === item.id
                      );
                      onClientSelect(selectedClientData);
                      handleItemSelect(category.id, item.id);
                      setManuallySelectedClientId(item.id);
                    } else {
                      handleItemSelect(category.id, item.id);
                      if (category.id === "forms") {
                        addBadge("FIX ME: Form Badge");
                      }
                    }
                  }}
                  className={`cursor-pointer p-1 rounded hover:bg-accent ${
                    selectedId === item.id ? "bg-accent" : ""
                  }`}
                >
                  {isClientContext(item)
                    ? `${item.name} (${item.email})`
                    : isClientNote(item)
                    ? (
                        <div className="flex justify-between items-center">
                          <span>{getClientNoteDisplayName(item)}</span>
                          {category.id === "notes" && (
                            <span onClick={(e) => {
                              e.stopPropagation(); // Prevent selecting the item
                              onDeleteNote(item.id);
                            }}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </span>
                          )}
                        </div>
                      )
                    : "Unknown"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isClientContext(item)
                    ? item.name
                    : isClientNote(item)
                    ? getClientNoteDisplayName(item)
                    : "Unknown"}
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
          <h2 className="text-lg font-medium mb-4 px-2">Client Context</h2>
        )}

        {isDesktop && (
          <div className="py-1">
            <div className="flex items-center gap-2 mb-2">
              <ListFilter className="size-4" />
              <h3 className="font-medium text-sm">Filter by Program</h3>
            </div>
            <Combobox
              options={[]}
              value={selectedProgram}
              onValueChange={setSelectedProgram}
              placeholder="Select a program..."
              className="w-full"
            />
          </div>
        )}

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
            onChange={(e) => {
              setSearchText(e.target.value);
              clearClientSelection();
              handleItemSelect("clients", null);
            }}
          />
        </div>

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

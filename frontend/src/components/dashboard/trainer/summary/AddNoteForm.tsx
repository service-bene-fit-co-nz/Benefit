"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientNoteType } from "@prisma/client";

const noteSchema = z.object({
  note: z.string().min(1, "Note content cannot be empty."),
  noteType: z.nativeEnum(ClientNoteType),
});

export type NoteFormValues = z.infer<typeof noteSchema>;

interface AddNoteFormProps {
  onSubmit: (values: NoteFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  selectedClientName: string;
  loggedInUserName: string;
}

export function AddNoteForm({ onSubmit, onCancel, isSubmitting, selectedClientName, loggedInUserName }: AddNoteFormProps) {
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      note: "",
      noteType: ClientNoteType.ClientNote,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="noteType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a note type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ClientNoteType.AINote}>AI Note</SelectItem>
                  <SelectItem value={ClientNoteType.TrainerNote}>Trainer Note</SelectItem>
                  <SelectItem value={ClientNoteType.ClientNote}>Client Note</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Note</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter note for the client..."
                  className="resize-y min-h-[240px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  fetchPrompts as serverFetchPrompts,
  createPrompt as serverCreatePrompt,
  updatePrompt as serverUpdatePrompt,
  deletePrompt as serverDeletePrompt,
  PromptData,
} from "@/server-actions/admin/prompts/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const promptTypes = [
  { value: "Trainer", label: "Trainer" },
];

interface PromptTypeComboboxProps {
  value: string;
  onChange: (newValue: string) => void;
  options: { value: string; label: string }[];
}

function PromptTypeCombobox({ value, onChange, options }: PromptTypeComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : "Select type..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search type..." />
          <CommandEmpty>No type found.</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  onChange(currentValue);
                  setOpen(false);
                }}
              >
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface PromptFormData {
  title: string;
  prompt: string;
  current: boolean;
  type: "Trainer";
}

export default function PromptsManagementPage() {
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<PromptFormData>({
    title: "",
    prompt: "",
    current: true,
    type: "Trainer",
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const data = await serverFetchPrompts(); // Direct call to server action
      setPrompts(data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPrompt) {
        await serverUpdatePrompt(editingPrompt, {
          title: formData.title,
          prompt: formData.prompt,
          current: formData.current,
          type: formData.type,
        });
      } else {
        await serverCreatePrompt({
          title: formData.title,
          prompt: formData.prompt,
          current: formData.current,
          type: formData.type,
        });
      }

      await fetchPrompts();
      resetForm();
      setEditingPrompt(null);
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Error saving prompt:", error);
      alert(`Error: ${error.message || "An unexpected error occurred."}`);
    }
  };

  const handleEdit = (prompt: PromptData) => {
    setEditingPrompt(prompt.id);
    setFormData({
      title: prompt.title,
      prompt: prompt.prompt,
      current: prompt.current,
      type: prompt.type,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (promptId: string) => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      try {
        await serverDeletePrompt(promptId); // Direct call to server action
        await fetchPrompts();
      } catch (error: any) {
        console.error("Error deleting prompt:", error);
        alert(`Error: ${error.message || "An unexpected error occurred."}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      prompt: "",
      current: true,
      type: "Trainer",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[UserRole.Admin, UserRole.SystemAdmin]}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Prompts Management</h1>
            <p className="text-gray-600">Manage AI prompts for various assessments</p>
          </div>
          <Button
            onClick={() => {
              setShowAddForm(true);
              setEditingPrompt(null);
              resetForm();
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Prompt
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingPrompt ? "Edit Prompt" : "Add New Prompt"}
              </CardTitle>
              <CardDescription>
                {editingPrompt
                  ? "Update the prompt details below"
                  : "Create a new AI prompt"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Fitness Assessment Prompt"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="prompt">Prompt Content</Label>
                  <Textarea
                    id="prompt"
                    value={formData.prompt}
                    onChange={(e) =>
                      setFormData({ ...formData, prompt: e.target.value })
                    }
                    placeholder="Enter the full prompt content here..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Prompt Type</Label>
                  <PromptTypeCombobox
                    value={formData.type}
                    onChange={(newValue) =>
                      setFormData({ ...formData, type: newValue as PromptData["type"] })
                    }
                    options={promptTypes}
                  />
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <input
                    type="checkbox"
                    id="current"
                    checked={formData.current}
                    onChange={(e) =>
                      setFormData({ ...formData, current: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="current">Set as Current</Label>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button type="submit">
                    {editingPrompt ? "Update Prompt" : "Create Prompt"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingPrompt(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Prompts List */}
        <div className="grid gap-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{prompt.title}</h3>
                      <Badge variant={prompt.current ? "default" : "secondary"}>
                        {prompt.current ? "Current" : "Not Current"}
                      </Badge>
                      <Badge variant="outline">{prompt.type}</Badge>
                    </div>

                    <p className="text-gray-600 mb-3 whitespace-pre-wrap">{prompt.prompt}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(prompt.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {prompts.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No prompts found. Create your first prompt to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

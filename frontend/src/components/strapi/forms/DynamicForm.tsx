import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormField from "./FormField";
import { submitForm, updateForm } from "@/server-actions/strapi/actions";
import { FormSubmissionPayload, FormFieldData, SubmissionType } from "@/server-actions/strapi/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Field {
  id: number;
  name: string;
  label: string;
  type:
    | "Text"
    | "TextArea"
    | "CheckBox"
    | "ComboBox"
    | "DatePicker"
    | "Email"
    | "Password"
    | "Adhoc";
  placeHolder?: string;
  required?: boolean;
  options?: any;
}

interface DynamicFormProps {
  id: number;
  __component: string;
  title: string;
  redirectTo?: string | null;
  submissionType: SubmissionType;
  field: Field[];
  formUniqueName?: string;
}

const DynamicForm = ({
  id: formId,
  title,
  redirectTo,
  submissionType,
  field,
  formUniqueName,
}: DynamicFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const rawFormData = new FormData(event.currentTarget);
    const payload: FormSubmissionPayload = [];
    let currentGroup: FormFieldData[] | null = null;
    let currentGroupName: string | null = null;
    let currentGroupLabel: string | null = null;

    for (let i = 0; i < field.length; i++) {
      const fieldDef = field[i];
      const value = rawFormData.get(fieldDef.name);

      if (fieldDef.type === "Adhoc" && fieldDef.options?.GroupBy) {
        // If a group was active, push it before starting a new one
        if (currentGroup && currentGroupName && currentGroupLabel) {
          payload.push({
            name: currentGroupName,
            label: currentGroupLabel,
            value: currentGroup,
          });
        }
        // Start new group
        currentGroup = [];
        currentGroupName = fieldDef.name; // Use adhoc field's name as group name
        currentGroupLabel = fieldDef.options?.Value || fieldDef.name; // Use adhoc field's Value as group label
      } else {
        let processedValue: FormDataEntryValue | string | null = value;

        if (fieldDef.type === "CheckBox") {
          processedValue = value === "on" ? "Yes" : "No";
        }

        // Only push if processedValue is not null (for non-checkbox fields that might be null)
        // Or if it's a checkbox, we always push "Yes" or "No"
        if (processedValue !== null) {
          const fieldData: FormFieldData = {
            name: fieldDef.name,
            label: fieldDef.label || fieldDef.name,
            value: processedValue,
          };
          if (currentGroup) {
            currentGroup.push(fieldData);
          } else {
            payload.push(fieldData);
          }
        }
      }
    }
    // Push any remaining active group after the loop
    if (currentGroup && currentGroupName && currentGroupLabel) {
      payload.push({
        name: currentGroupName,
        label: currentGroupLabel,
        value: currentGroup,
      });
    }

    const result = await submitForm(
      formId.toString(),
      payload,
      submissionType,
      formUniqueName
    );

    if (result.success) {
      toast.success(result.message);
      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo);
        }, 1500);
      }
    } else {
      if (result.code === "EXISTING_FOUND" && submissionType === "AllowUpdate") {
        setExistingSubmissionId(result.existingSubmissionId || null);
        setShowOverwriteConfirm(true);
      } else {
        toast.error(result.error);
      }
    }
    setIsSubmitting(false);
  };

  const handleOverwriteConfirm = async () => {
    if (!existingSubmissionId) return;

    setIsSubmitting(true);
    setShowOverwriteConfirm(false);

    // Re-read form data for the overwrite action
    const formElement = document.getElementById(`dynamic-form-${formId}`); // Assuming form has an ID
    if (!formElement || !(formElement instanceof HTMLFormElement)) {
      toast.error("Form element not found for overwrite.");
      setIsSubmitting(false);
      return;
    }
    const rawFormData = new FormData(formElement);
    const payload: FormSubmissionPayload = [];
    let currentGroup: FormFieldData[] | null = null;
    let currentGroupName: string | null = null;
    let currentGroupLabel: string | null = null;

    for (let i = 0; i < field.length; i++) {
      const fieldDef = field[i];
      const value = rawFormData.get(fieldDef.name);

      if (fieldDef.type === "Adhoc" && fieldDef.options?.GroupBy) {
        // If a group was active, push it before starting a new one
        if (currentGroup && currentGroupName && currentGroupLabel) {
          payload.push({
            name: currentGroupName,
            label: currentGroupLabel,
            value: currentGroup,
          });
        }
        // Start new group
        currentGroup = [];
        currentGroupName = fieldDef.name; // Use adhoc field's name as group name
        currentGroupLabel = fieldDef.options?.Value || fieldDef.name; // Use adhoc field's Value as group label
      } else {
        let processedValue: FormDataEntryValue | string | null = value;

        if (fieldDef.type === "CheckBox") {
          processedValue = value === "on" ? "Yes" : "No";
        }

        // Only push if processedValue is not null (for non-checkbox fields that might be null)
        // Or if it's a checkbox, we always push "Yes" or "No"
        if (processedValue !== null) {
          const fieldData: FormFieldData = {
            name: fieldDef.name,
            label: fieldDef.label || fieldDef.name,
            value: processedValue,
          };
          if (currentGroup) {
            currentGroup.push(fieldData);
          } else {
            payload.push(fieldData);
          }
        }
      }
    }
    // Push any remaining active group after the loop
    if (currentGroup && currentGroupName && currentGroupLabel) {
      payload.push({
        name: currentGroupName,
        label: currentGroupLabel,
        value: currentGroup,
      });
    }

    const result = await updateForm(existingSubmissionId, payload);

    if (result.success) {
      toast.success(result.message);
      if (redirectTo) {
        setTimeout(() => {
          router.push(redirectTo);
        }, 1500);
      }
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <form
      id={`dynamic-form-${formId}`}
      onSubmit={handleSubmit}
      className="space-y-4 p-5 lg:px-[200px] lg:py-5"
    >
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {field.map((field) => (
        <FormField key={field.id} field={field} />
      ))}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center">
            <Spinner size="sm" className="mr-2" /> Submitting...
          </span>
        ) : (
          "Submit"
        )}
      </Button>

      <AlertDialog open={showOverwriteConfirm} onOpenChange={setShowOverwriteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              You have already submitted this form. Do you want to overwrite your previous submission?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverwriteConfirm} disabled={isSubmitting}>
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default DynamicForm;

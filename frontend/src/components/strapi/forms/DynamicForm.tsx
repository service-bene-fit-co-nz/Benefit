import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormField from "./FormField";
import { submitForm, updateForm } from "@/server-actions/strapi/actions";
import {
  ClientNotePayload,
  FormFieldData,
  SubmissionType,
} from "@/server-actions/strapi/types";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const [existingSubmissionId, setExistingSubmissionId] = useState<
    string | null
  >(null);
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  });

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {
      firstName: contactInfo.firstName ? "" : "First name is required",
      lastName: contactInfo.lastName ? "" : "Last name is required",
      email: contactInfo.email ? "" : "Email is required",
      contactNumber: contactInfo.contactNumber
        ? ""
        : "Contact number is required",
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const buildPayloadFromFormData = (
    rawFormData: FormData
  ): ClientNotePayload => {
    const payload: ClientNotePayload = [];

    // Handle contact information
    const { firstName, lastName, email, contactNumber } = contactInfo;

    if (firstName && lastName && email && contactNumber) {
      payload.push({
        name: "contactInformation",
        label: "Contact Information",
        value: [
          { name: "firstName", label: "First Name", value: firstName },
          { name: "lastName", label: "Last Name", value: lastName },
          { name: "email", label: "Email", value: email },
          {
            name: "contactNumber",
            label: "Contact Number",
            value: contactNumber,
          },
        ],
      });
    }

    let currentGroup: FormFieldData[] | null = null;
    let currentGroupName: string | null = null;
    let currentGroupLabel: string | null = null;

    for (let i = 0; i < field.length; i++) {
      const fieldDef = field[i];
      const value = rawFormData.get(fieldDef.name);

      if (fieldDef.type === "Adhoc" && fieldDef.options?.GroupBy) {
        if (currentGroup && currentGroupName && currentGroupLabel) {
          payload.push({
            name: currentGroupName,
            label: currentGroupLabel,
            value: currentGroup,
          });
        }
        currentGroup = [];
        currentGroupName = fieldDef.name;
        currentGroupLabel = fieldDef.options?.Value || fieldDef.name;
      } else {
        let processedValue: FormDataEntryValue | string | null = value;

        if (fieldDef.type === "CheckBox") {
          processedValue = value === "on" ? "Yes" : "No";
        }

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
    if (currentGroup && currentGroupName && currentGroupLabel) {
      payload.push({
        name: currentGroupName,
        label: currentGroupLabel,
        value: currentGroup,
      });
    }
    return payload;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const rawFormData = new FormData(event.currentTarget);
    const payload = buildPayloadFromFormData(rawFormData);

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
      if (
        result.code === "EXISTING_FOUND" &&
        submissionType === "AllowUpdate"
      ) {
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

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setShowOverwriteConfirm(false);

    const formElement = document.getElementById(`dynamic-form-${formId}`);
    if (!formElement || !(formElement instanceof HTMLFormElement)) {
      toast.error("Form element not found for overwrite.");
      setIsSubmitting(false);
      return;
    }
    const rawFormData = new FormData(formElement);
    const payload = buildPayloadFromFormData(rawFormData);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="firstName">First Name</Label>
            {errors.firstName && (
              <span className="text-red-500 text-xs ml-2">
                {errors.firstName}
              </span>
            )}
          </div>
          <Input
            id="firstName"
            name="firstName"
            placeholder="Enter your first name"
            value={contactInfo.firstName}
            onChange={handleContactInfoChange}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="lastName">Last Name</Label>
            {errors.lastName && (
              <span className="text-red-500 text-xs ml-2">
                {errors.lastName}
              </span>
            )}
          </div>
          <Input
            id="lastName"
            name="lastName"
            placeholder="Enter your last name"
            value={contactInfo.lastName}
            onChange={handleContactInfoChange}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="email">Email</Label>
            {errors.email && (
              <span className="text-red-500 text-xs ml-2">{errors.email}</span>
            )}
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={contactInfo.email}
            onChange={handleContactInfoChange}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="contactNumber">Contact Number</Label>
            {errors.contactNumber && (
              <span className="text-red-500 text-xs ml-2">
                {errors.contactNumber}
              </span>
            )}
          </div>
          <Input
            id="contactNumber"
            name="contactNumber"
            placeholder="Enter your contact number"
            value={contactInfo.contactNumber}
            onChange={handleContactInfoChange}
          />
        </div>
      </div>

      {field.map((field) => (
        <FormField key={field.id} field={field} />
      ))}

      {Object.values(errors).some((error) => error !== "") && (
        <div className="flex justify-center">
          <p className="text-red-500 text-sm mt-2">
            There was an error with your submission. Please check the fields
            above.
          </p>
        </div>
      )}
      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-[300px]"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <Spinner size="sm" className="mr-2" /> Submitting...
            </span>
          ) : (
            "Submit"
          )}
        </Button>
      </div>

      <AlertDialog
        open={showOverwriteConfirm}
        onOpenChange={setShowOverwriteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Existing Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              You have already submitted this form. Do you want to overwrite
              your previous submission?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleOverwriteConfirm}
              disabled={isSubmitting}
            >
              Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default DynamicForm;

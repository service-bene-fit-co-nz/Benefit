
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextAreaInputProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const TextArea = ({ label, name, placeHolder, required }: TextAreaInputProps) => {
    return (
      <div className="flex flex-col space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Textarea
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
        />
      </div>
    );
  };
  
  export default TextArea;
  
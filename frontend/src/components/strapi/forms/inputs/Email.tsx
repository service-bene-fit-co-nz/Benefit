
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailInputProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const Email = ({ label, name, placeHolder, required }: EmailInputProps) => {
    return (
      <div className="flex flex-col space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          type="email"
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
        />
      </div>
    );
  };
  
  export default Email;
  
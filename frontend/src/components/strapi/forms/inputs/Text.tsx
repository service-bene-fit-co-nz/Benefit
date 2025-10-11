
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextInputProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const Text = ({ label, name, placeHolder, required }: TextInputProps) => {
    return (
      <div className="flex flex-col space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          type="text"
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
        />
      </div>
    );
  };
  
  export default Text;
  
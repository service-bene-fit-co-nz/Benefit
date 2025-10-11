
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const Password = ({ label, name, placeHolder, required }: PasswordProps) => {
    return (
      <div className="flex flex-col space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input
          type="password"
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
        />
      </div>
    );
  };
  
  export default Password;
  
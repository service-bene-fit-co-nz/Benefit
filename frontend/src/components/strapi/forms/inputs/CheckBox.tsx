
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckBoxProps {
    label: string;
    name: string;
    required: boolean;
  }
  
  const CheckBox = ({ label, name, required }: CheckBoxProps) => {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox id={name} name={name} required={required} />
        <Label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </Label>
      </div>
    );
  };
  
  export default CheckBox;
  
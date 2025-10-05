
import { Label } from "@radix-ui/react-label";

interface ComboBoxProps {
    label: string;
    name: string;
    required: boolean;
    options: string;
}

const ComboBox = ({ label, name, required, options }: ComboBoxProps) => {
    const optionList = options ? options.split(',').map(option => option.trim()) : [];

    return (
        <div className="flex flex-col">
            <Label htmlFor={name} className="mb-1 font-medium">{label}</Label>
            <select id={name} name={name} required={required} className="p-2 border rounded">
                {optionList.map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
    );
};

export default ComboBox;

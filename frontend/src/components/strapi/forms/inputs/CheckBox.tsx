
interface CheckBoxProps {
    label: string;
    name: string;
    required: boolean;
  }
  
  const CheckBox = ({ label, name, required }: CheckBoxProps) => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          id={name}
          name={name}
          required={required}
          className="mr-2"
        />
        <label htmlFor={name} className="font-medium">{label}</label>
      </div>
    );
  };
  
  export default CheckBox;
  
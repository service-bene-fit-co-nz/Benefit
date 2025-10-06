
interface TextInputProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const Text = ({ label, name, placeHolder, required }: TextInputProps) => {
    return (
      <div className="flex flex-col">
        <label htmlFor={name} className="mb-1 font-medium">{label}</label>
        <input
          type="text"
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
          className="p-2 border rounded"
        />
      </div>
    );
  };
  
  export default Text;
  
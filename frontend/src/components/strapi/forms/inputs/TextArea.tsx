
interface TextAreaInputProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const TextArea = ({ label, name, placeHolder, required }: TextAreaInputProps) => {
    return (
      <div className="flex flex-col">
        <label htmlFor={name} className="mb-1 font-medium">{label}</label>
        <textarea
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
          className="p-2 border rounded"
        />
      </div>
    );
  };
  
  export default TextArea;
  
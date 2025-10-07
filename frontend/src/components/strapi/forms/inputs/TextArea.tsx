
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
          className="p-2 border rounded text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
        />
      </div>
    );
  };
  
  export default TextArea;
  
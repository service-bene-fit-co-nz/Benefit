
interface EmailInputProps {
    label: string;
    name: string;
    placeHolder?: string;
    required: boolean;
  }
  
  const Email = ({ label, name, placeHolder, required }: EmailInputProps) => {
    return (
      <div className="flex flex-col">
        <label htmlFor={name} className="mb-1 font-medium">{label}</label>
        <input
          type="email"
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
          className="p-2 border rounded"
        />
      </div>
    );
  };
  
  export default Email;
  
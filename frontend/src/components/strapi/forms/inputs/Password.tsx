
interface PasswordProps {
    label: string;
    name: string;
    placeholder?: string;
    required: boolean;
  }
  
  const Password = ({ label, name, placeHolder, required }: PasswordProps) => {
    return (
      <div className="flex flex-col">
        <label htmlFor={name} className="mb-1 font-medium">{label}</label>
        <input
          type="password"
          id={name}
          name={name}
          placeholder={placeHolder}
          required={required}
          className="p-2 border rounded"
        />
      </div>
    );
  };
  
  export default Password;
  
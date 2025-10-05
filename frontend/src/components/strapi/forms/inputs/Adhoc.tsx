
interface AdhocProps {
    options: {
      Type: string;
      Value: string;
    };
  }
  
  const Adhoc = ({ options }: AdhocProps) => {
    if (!options) {
      return null; // Or return an error message
    }
  
    switch (options.Type.toLowerCase()) {
      case "h1":
        return <h1 className="text-2xl font-bold my-4">{options.Value}</h1>;
      case "p":
        return <p className="my-2">{options.Value}</p>;
      // Add other cases here in the future, e.g., H2, H3, Paragraph, etc.
      default:
        return (
          <div className="text-red-500">
            Unknown adhoc component type: {options.Type}
          </div>
        );
    }
  };
  
  export default Adhoc;
  
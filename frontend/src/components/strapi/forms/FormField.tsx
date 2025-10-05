
import Text from "./inputs/Text";
import TextArea from "./inputs/TextArea";
import Email from "./inputs/Email";
import Password from "./inputs/Password";
import CheckBox from "./inputs/CheckBox";
import DatePicker from "./inputs/DatePicker";
import ComboBox from "./inputs/ComboBox";
import Adhoc from "./inputs/Adhoc";

const FormField = ({ field }: { field: any }) => {
  // The field object from the API has a 'type' property that we can use to
  // determine which component to render.
  switch (field.type) {
    case "Text":
      return <Text {...field} />;
    case "TextArea":
      return <TextArea {...field} />;
    case "Email":
      return <Email {...field} />;
    case "Password":
      return <Password {...field} />;
    case "CheckBox":
      return <CheckBox {...field} />;
    case "DatePicker":
      return <DatePicker {...field} />;
    case "ComboBox":
      return <ComboBox {...field} />;
    case "Adhoc":
      return <Adhoc {...field} />;
    default:
      return (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline">
            Component {field.type} not found.
          </span>
        </div>
      );
  }
};

export default FormField;

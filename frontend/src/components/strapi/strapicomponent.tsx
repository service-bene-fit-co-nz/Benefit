import Hero from "@/components/strapi/section/hero";
import RT from "@/components/strapi/shared/richtext";
import DynamicForm from "./forms/DynamicForm";
import { cn } from "@/lib/utils";

const StrapiComponent = ({
  component,
  showBorder = false,
}: {
  component: any;
  showBorder?: boolean;
}) => {
  const componentToRender = () => {
    switch (component.__component) {
      case "sections.hero":
        return <Hero {...component} />;
      case "sections.form":
        return <DynamicForm {...component} />;
      case "shared.rich-text":
        return <RT {...component} />;
      default:
        return (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline">
              {" "}
              Component {component.__component} not found.
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "px-0 py-0",
        showBorder && "border-2 border-dashed border-gray-300"
      )}
    >
      {componentToRender()}
    </div>
  );
};

export default StrapiComponent;

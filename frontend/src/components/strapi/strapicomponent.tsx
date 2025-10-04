import Hero from "@/components/strapi/section/hero";

const StrapiComponent = ({ component }: { component: any }) => {
  switch (component.__component) {
    case "sections.hero":
      return <Hero {...component} />;
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

export default StrapiComponent;

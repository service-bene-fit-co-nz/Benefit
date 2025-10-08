import { getStrapiMedia } from "@/lib/strapi-utils";

interface HeroProps {
  title: string;
  description: string;
  image: any;
  type: string;
}

interface LayoutProps {
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
}

const FullImageLayout: React.FC<LayoutProps> = ({
  title,
  description,
  imageUrl,
  imageAlt,
}) => (
  <div className="relative h-screen">
    {imageUrl && (
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src={imageUrl}
        alt={imageAlt}
      />
    )}
    <div className="absolute inset-0 bg-black opacity-50"></div>
    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
      <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
        {title}
      </h2>
      <p className="mt-6 max-w-2xl text-xl text-gray-200">{description}</p>
    </div>
  </div>
);

interface SplitLayoutProps extends LayoutProps {
  side: "Left" | "Right";
  fraction: string;
}

const getGridClasses = (
  fraction: string
): { container: string; image: string; text: string } => {
  switch (fraction) {
    case "1/4":
      return {
        container: "md:grid-cols-4",
        image: "md:col-span-1",
        text: "md:col-span-3",
      };
    case "1/3":
      return {
        container: "md:grid-cols-3",
        image: "md:col-span-1",
        text: "md:col-span-2",
      };
    case "1/2":
      return {
        container: "md:grid-cols-2",
        image: "md:col-span-1",
        text: "md:col-span-1",
      };
    case "2/3":
      return {
        container: "md:grid-cols-3",
        image: "md:col-span-2",
        text: "md:col-span-1",
      };
    case "3/4":
      return {
        container: "md:grid-cols-4",
        image: "md:col-span-3",
        text: "md:col-span-1",
      };
    default:
      return {
        container: "md:grid-cols-2",
        image: "md:col-span-1",
        text: "md:col-span-1",
      };
  }
};

const SplitLayout: React.FC<SplitLayoutProps> = ({
  title,
  description,
  imageUrl,
  imageAlt,
  side,
  fraction,
}) => {
  const gridClasses = getGridClasses(fraction);

  return (
    <div className={`grid grid-cols-1 ${gridClasses.container} gap-0`}>
      <div
        className={`relative ${gridClasses.image} ${
          side === "Right" ? "md:order-last" : ""
        }`}
      >
        {imageUrl && (
          <img
            className="h-full w-full object-cover"
            src={imageUrl}
            alt={imageAlt}
          />
        )}
      </div>
      <div
        className={`${gridClasses.text} flex flex-col items-center justify-center p-8 text-center`}
      >
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {title}
        </h2>
        <p className="mt-6 max-w-2xl text-xl">{description}</p>
      </div>
    </div>
  );
};

const Hero: React.FC<HeroProps> = ({ title, description, image, type }) => {
  const imageUrl = getStrapiMedia(image);
  const imageAlt = image?.alternativeText || "";

  if (type === "Full Image") {
    return (
      <FullImageLayout
        title={title}
        description={description}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
      />
    );
  }

  const match = type.match(/(Left|Right) Image (\d+\/\d+)/);
  if (match) {
    const [, side, fraction] = match as ["", "Left" | "Right", string];
    return (
      <SplitLayout
        title={title}
        description={description}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        side={side}
        fraction={fraction}
      />
    );
  }

  // Default to Full Image layout if type is not recognized
  return (
    <FullImageLayout
      title={title}
      description={description}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
    />
  );
};

export default Hero;

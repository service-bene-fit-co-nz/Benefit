import { getStrapiMedia } from "@/lib/strapi-utils";

interface HeroProps {
  title: string;
  description: string;
  image: any; // Or a more specific type for your image object
}

const Hero: React.FC<HeroProps> = ({ title, description, image }) => {
  const imageUrl = getStrapiMedia(image);

  return (
    <div className="relative h-screen"> {/* Set a height for the hero section */}
      {imageUrl && (
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={imageUrl}
          alt={image.alternativeText || ""}
        />
      )}
      <div className="absolute inset-0 bg-black opacity-50"></div> {/* Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          {title}
        </h2>
        <p className="mt-6 max-w-2xl text-xl text-gray-200">
          {description}
        </p>
      </div>
    </div>
  );
};

export default Hero;

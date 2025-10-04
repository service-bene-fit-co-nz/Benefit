interface HeroProps {
  title: string;
  description: string;
  image: string;
}

const Hero: React.FC<HeroProps> = ({ title, description, image }) => {
  return (
    <div className="relative bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-xl text-gray-500">
              {description}
            </p>
          </div>
          <div className="relative mt-12">
            <img
              className="mx-auto h-auto w-full rounded-lg shadow-xl ring-1 ring-gray-400/10 sm:w-3/4 lg:w-full"
              src={image}
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

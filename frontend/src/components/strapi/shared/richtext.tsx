import { getStrapiMedia } from "@/lib/strapi-utils";

interface RichTextProps {
  body: string;
}

const RT: React.FC<RichTextProps> = ({ body }) => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p>{body}</p>
    </div>
  );
};

export default RT;

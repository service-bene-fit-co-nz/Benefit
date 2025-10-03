"use client";
import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";

type PageData = {
  id: number;
  attributes: {
    title: string;
    content: string;
    slug: string;
  };
};

const DynamicPage = () => {
  const params = useParams();
  const slug = params.slug;
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      const fetchPage = async () => {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";
          const response = await fetch(
            `${apiUrl}/api/pages?filters[slug][$eq]=${slug}`
          );

          if (!response.ok) {
            // For 404, trigger the notFound page
            if (response.status === 404) {
              notFound();
            }
            // For other errors, throw to be caught by the catch block
            throw new Error("Failed to fetch page data.");
          }

          const data = await response.json();

          if (data.data.length === 0) {
            // If response is OK but no data, also trigger notFound
            notFound();
          }

          setPage(data.data[0]);
        } catch (err: any) {
          // Set the error in state to be thrown on next render
          setError(err.message || String(err));
        } finally {
          setLoading(false);
        }
      };

      fetchPage();
    }
  }, [slug]);

  // If an error was caught, throw it so the error boundary can catch it
  if (error) {
    throw error;
  }

  if (!page) {
    return <div>Page not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{page.attributes.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.attributes.content }} />
    </div>
  );
};

export default DynamicPage;

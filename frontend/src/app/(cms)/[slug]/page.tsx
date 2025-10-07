"use client";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import StrapiComponent from "@/components/strapi/strapicomponent";
import qs from "qs";

type PageData = {
  id: number;
  title: string;
  slug: string;
  pageContent: any[]; // Or a more specific type for your components
};

const fetchPage = async (slug: string | string[]) => {
  const apiUrl =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";

  const query = qs.stringify(
    {
      populate: {
        pageContent: {
          populate: "*",
        },
      },
    },
    {
      encodeValuesOnly: true,
    }
  );

  console.log("Fetching page with slug:", slug);
  console.log(`${apiUrl}/api/pages?filters[slug][$eq]=${slug}&${query}`);

  const response = await fetch(
    `${apiUrl}/api/pages?filters[slug][$eq]=${slug}&${query}`
  );
  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error("Failed to fetch page data.");
  }
  const data = await response.json();
  if (data.data.length === 0) {
    notFound();
  }
  return data.data[0];
};

import { useState, useEffect } from "react";

const DynamicPage = () => {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [_debug, setDebug] = useState(false);

  useEffect(() => {
    // Only enable the debug toggle in non-production environments
    if (process.env.NODE_ENV !== "production") {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Toggle debug mode with the F9 key
        if (event.key === "F9") {
          event.preventDefault();
          setDebug((prevDebug) => !prevDebug);
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      // Cleanup the event listener on component unmount
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []); // Empty dependency array ensures this effect runs only once

  const {
    data: page,
    isLoading,
    error,
  } = useQuery<PageData>({
    queryKey: ["page", slug],
    queryFn: () => fetchPage(slug || ""),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    // This will be caught by the nearest error boundary
    throw error;
  }

  if (!page) {
    // This case should ideally be handled by the notFound() in fetchPage,
    // but as a fallback, we can show a message.
    return <div>Page not found for {slug}.</div>;
  }

  return (
    <div>
      {page.pageContent.map((component, index) => (
        <div key={index}>
          <StrapiComponent component={component} showBorder={_debug} />
          {_debug && (
            <div className="container mx-auto px-4">
              <div className="mt-4 py-4 px-8 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Component JSON:</h3>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(component, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicPage;

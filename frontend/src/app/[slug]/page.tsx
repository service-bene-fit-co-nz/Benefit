"use client";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
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

const DynamicPage = () => {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const showJson = false;

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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-64 w-full" />
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
    <div className="py-8">
      {page.pageContent.map((component, index) => (
        <div key={index} className="border-b-2 border-gray-200 py-4">
          <StrapiComponent component={component} />
          {showJson && (
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

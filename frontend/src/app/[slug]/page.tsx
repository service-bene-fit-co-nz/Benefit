"use client";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import StrapiComponent from "@/components/strapi/strapicomponent";

type PageData = {
  id: number;
  title: string;
  slug: string;
  pageContent: any[]; // Or a more specific type for your components
};

const fetchPage = async (slug: string | string[]) => {
  const apiUrl =
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";
  const response = await fetch(
    `${apiUrl}/api/pages?filters[slug][$eq]=${slug}&populate=*`
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
    <div>
      {page.pageContent.map((component, index) => (
        <StrapiComponent key={index} component={component} />
      ))}
    </div>
  );
};

export default DynamicPage;

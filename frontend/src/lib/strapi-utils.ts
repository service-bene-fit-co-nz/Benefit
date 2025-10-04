export function getStrapiMedia(media: any) {
  if (!media?.url) {
    return null;
  }
  const apiUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";
  return media.url.startsWith("http") ? media.url : `${apiUrl}${media.url}`;
}

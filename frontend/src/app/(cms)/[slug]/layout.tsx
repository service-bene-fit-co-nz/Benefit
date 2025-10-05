export default function CmsSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The providers and root HTML structure are inherited from the parent layout.
  // This layout wraps children in a full-width div to override the parent's centering.
  return <div className="w-full">{children}</div>;
}

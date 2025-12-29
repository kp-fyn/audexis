import BlogStyles from "./BlogStyles";
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlogStyles>{children}</BlogStyles>;
}

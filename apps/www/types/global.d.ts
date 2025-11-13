declare module "*.mdx" {
  let MDXContent: (props: any) => JSX.Element;
  export default MDXContent;
  export const metadata: any;
}

import createMDX from "@next/mdx";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [["remark-gfm", { strict: true, throwOnError: true }]],
  },
});

export default withMDX({
  pageExtensions: ["ts", "tsx", "mdx"],
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
});

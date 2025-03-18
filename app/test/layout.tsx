import Layout from "../layout/index";

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
} 
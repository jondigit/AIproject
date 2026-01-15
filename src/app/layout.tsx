export const metadata = {
  title: "LocalBoost AI Demo",
  description: "Demo of AI-driven local business automation + SEO"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

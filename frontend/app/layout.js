import "./globals.css";

export const metadata = {
  title: "Alaya - Personal Knowledge Platform",
  description: "AI-powered personal knowledge and conversational retrieval platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}

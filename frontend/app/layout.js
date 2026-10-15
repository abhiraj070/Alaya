import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata = {
  title: "Alaya - Personal Knowledge Platform",
  description: "AI-powered personal knowledge and conversational retrieval platform.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-bg-primary text-text-primary antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

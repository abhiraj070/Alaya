import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import ThemeSync from "@/components/ui/ThemeSync";

export const metadata = {
  title: "Alaya - Personal Knowledge Platform",
  description: "AI-powered personal knowledge and conversational retrieval platform.",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('alaya_theme');
    var isLight = false;
    if (stored) {
      try {
        isLight = JSON.parse(stored) === 'light';
      } catch (e) {
        isLight = stored === 'light' || stored === '"light"';
      }
    }
    var root = document.documentElement;
    if (isLight) {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="dark"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="min-h-screen bg-bg-primary text-text-primary antialiased"
        suppressHydrationWarning
      >
        <ThemeSync />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

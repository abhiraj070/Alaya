import "./globals.css";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('alaya_theme');if(t==='light'){document.documentElement.classList.add('light');document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-bg-primary text-text-primary antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

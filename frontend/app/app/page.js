import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import KnowledgeBaseManager from "@/components/app/KnowledgeBaseManager";

export default function AppPage() {
  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary flex flex-col selection:bg-accent-sky/25 selection:text-text-primary">
      <Navbar />
      <main className="flex-1 py-8">
        <KnowledgeBaseManager />
      </main>
      <Footer />
    </div>
  );
}

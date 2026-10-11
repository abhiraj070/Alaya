export default async function AuthPage({ searchParams }) {
  const params = await searchParams;
  const mode = params?.mode === "signup" ? "Sign Up" : "Sign In";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-bg-primary text-text-primary">
      <h1 className="heading-section">Authentication</h1>
      <p className="mt-2 text-body">
        Selected Mode: <span className="text-accent-sky font-semibold">{mode}</span>
      </p>
    </main>
  );
}

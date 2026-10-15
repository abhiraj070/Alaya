import { universeApi } from "./api.js";

export async function openMemoryUniverse({
  baseUrl = process.env.NEXT_PUBLIC_MEMORY_UNIVERSE_URL || "http://localhost:5173",
  openWindow = () => window.open("about:blank", "_blank"),
  getToken = () => universeApi.getToken({ cache: "no-store" }),
} = {}) {
  // Reserve the tab during the click so asynchronous authentication is not popup-blocked.
  const tab = openWindow();
  if (!tab) throw new Error("Allow pop-ups to open Memory Universe.");
  tab.opener = null;
  try {
    const { token } = await getToken();
    if (!token) throw new Error("Could not authenticate Memory Universe. Please sign in again.");
    const url = new URL(baseUrl);
    url.searchParams.set("token", token);
    tab.location.replace(url.toString());
  } catch (error) {
    tab.close();
    throw error;
  }
}

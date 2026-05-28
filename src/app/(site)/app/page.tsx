import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// /app heeft historisch het account-dashboard gehost. In v2 (agent-first
// relaunch) is dat verhuisd naar /mijn-weerzone — de naam matcht het menu
// en de productdefinitie ("Mijn Weerzone vervangt Account"). Sub-routes
// (/app/login, /app/signup, /app/onboarding, /app/reset)
// blijven werken zodat lopende auth-flows niet breken.
export default function AppRoot() {
  redirect("/mijn-weerzone");
}

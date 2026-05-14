import { getSupabase } from "@/lib/supabase";
import B2BAdminPanel from "@/components/B2BAdminPanel";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

interface PageProps {
  searchParams: Promise<{ secret?: string }>;
}

export default async function B2BAdminPage({ searchParams }: PageProps) {
  const { secret } = await searchParams;
  const cronSecret = process.env.CRON_SECRET;

  // 1. Auth Check (Founder bypass)
  const supabase = getSupabase();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { isFounderEmail } = await import("@/lib/founders");
  
  const isAuthorized = (user && isFounderEmail(user.email)) || (cronSecret && secret === cronSecret);
  
  if (!isAuthorized && cronSecret) {
    return (
      <div style={{ padding: 48, fontFamily: "var(--font-inter), system-ui", background: "#020617", minHeight: "100vh", color: "#fff" }}>
        <h1 style={{ color: "#ef4444", fontWeight: 900, fontSize: "2rem", marginBottom: 8, letterSpacing: "-0.05em" }}>TOEGANG GEWEIGERD</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.2em", fontWeight: 700 }}>
          Je bent niet ingelogd als founder of de secret ontbreekt.
        </p>
      </div>
    );
  }



  let leads: Array<{
    id: string;
    business_name: string;
    email: string;
    city: string | null;
    industry: string;
    phone: string | null;
    status: string;
    outreach_count: number;
    source: string;
    created_at: string;
  }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("b2b_leads")
      .select("id, business_name, email, city, industry, phone, status, outreach_count, source, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    leads = data ?? [];
  }

  const stats = {
    total:      leads.length,
    new:        leads.filter((l) => l.status === "new").length,
    emailed:    leads.filter((l) => l.status === "emailed").length,
    subscribed: leads.filter((l) => l.status === "subscribed").length,
  };

  return <B2BAdminPanel stats={stats} leads={leads} secret={secret ?? ""} />;
}

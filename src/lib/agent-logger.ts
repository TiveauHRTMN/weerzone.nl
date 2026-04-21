import { getSupabase } from "./supabase";

export type AgentName = "Hermes" | "OpenClaw" | "Paperclip" | "Sentinel" | "B2B Ignite" | "Performance Control" | "SEO Architect";
export type ActionType = "lead_found" | "outreach_sent" | "content_generated" | "alert_triggered" | "system_check";

export async function logAgentAction(
  agentName: AgentName,
  actionType: ActionType,
  description: string,
  metadata: any = {}
) {
  const supabase = getSupabase();
  if (!supabase) return;

  console.log(`[AGENT ${agentName}] ${actionType}: ${description}`);

  try {
    const { error } = await supabase
      .from("agent_activity")
      .insert({
        agent_name: agentName,
        action_type: actionType,
        description,
        metadata,
        created_at: new Date().toISOString(),
      });

    if (error) {
       console.error("[AGENT LOGGER ERROR]:", error);
       console.warn("Could not log to agent_activity table. Is it created in Supabase?");
    }
  } catch (e) {
    console.error("[AGENT LOGGER FATAL EXCEPTION]:", e);
  }
}

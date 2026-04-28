import { getSupabaseAdmin } from "./supabase";

export type AgentName = "Hermes" | "OpenClaw" | "Paperclip" | "Sentinel" | "B2B Ignite" | "Performance Control" | "SEO Architect" | "Discovery Engine";
export type ActionType = "lead_found" | "outreach_sent" | "content_generated" | "alert_triggered" | "system_check" | "indexing_scan" | "yield_optimized" | "location_discovered";

export async function logAgentAction(
  agentName: AgentName,
  actionType: ActionType,
  description: string,
  metadata: any = {}
) {
  const supabase = getSupabaseAdmin();
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

/**
 * Paperclip Heartbeat: Signaleert dat een agent-programma nog leeft en gezond is.
 */
export async function logPaperclipHeartbeat(programName: string, status: "healthy" | "degraded" | "failing" = "healthy") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("agent_activity").insert({
    agent_name: programName as AgentName,
    action_type: "system_check",
    description: `Paperclip Pulse: ${programName} is ${status}.`,
    metadata: { paperclip_pulse: true, status, timestamp: new Date().toISOString() }
  });
}


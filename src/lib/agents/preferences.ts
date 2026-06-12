export type AgentPreferenceKey = "piet" | "reed" | "koos";
export interface AgentPreferences {
  piet: boolean;
  reed: boolean;
  koos: boolean;
}

export const ALL_AGENT_PREFERENCES: AgentPreferences = {
  piet: true,
  reed: true,
  koos: true,
};

export const DEFAULT_ACCOUNT_AGENT_PREFERENCES: AgentPreferences = {
  piet: true,
  reed: false,
  koos: false,
};

export function preferencesFromProfile(profile: {
  piet_on?: boolean | null;
  reed_on?: boolean | null;
  koos_on?: boolean | null;
} | null | undefined, accountPreferences?: Partial<Record<AgentPreferenceKey, unknown>> | null): AgentPreferences {
  const value = (agent: AgentPreferenceKey, profileValue: boolean | null | undefined, fallback: boolean) =>
    typeof accountPreferences?.[agent] === "boolean" ? accountPreferences[agent] : profileValue ?? fallback;
  return {
    piet: value("piet", profile?.piet_on, DEFAULT_ACCOUNT_AGENT_PREFERENCES.piet),
    reed: value("reed", profile?.reed_on, DEFAULT_ACCOUNT_AGENT_PREFERENCES.reed),
    koos: value("koos", profile?.koos_on, DEFAULT_ACCOUNT_AGENT_PREFERENCES.koos),
  };
}

export function activeAgentKeys(preferences: AgentPreferences): AgentPreferenceKey[] {
  return (["piet", "reed", "koos"] as const).filter((agent) => isAgentEnabled(preferences, agent));
}

export function isAgentEnabled(preferences: AgentPreferences, agent: AgentPreferenceKey): boolean {
  return preferences[agent];
}

export function hasActiveAgents(preferences: AgentPreferences): boolean {
  return activeAgentKeys(preferences).length > 0;
}

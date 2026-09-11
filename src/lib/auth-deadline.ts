/**
 * Deadline rond `supabase.auth.getUser()`.
 *
 * Dit is dezelfde val als bij de weerverrijking, maar dan op auth. De
 * supabase-js-client doet zijn eigen retries: is de auth-backend onbereikbaar,
 * dan komt er geen snelle fout maar een stilte van ~8 seconden. Een `try/catch`
 * vangt die fout wel, maar de tijd niet.
 *
 * Gevolg tijdens de storing van september 2026: `getAgentPreferences()` zat
 * zonder deadline in de `Promise.all` van /vandaag, dus élke render wachtte die
 * 8 s uit. Aan de clientkant deed `session-context` hetzelfde, waardoor de nav
 * en de inlogknop seconden lang in hun lege staat bleven staan. De pagina gaf
 * netjes 200 — hij was alleen tergend traag.
 *
 * 2500 ms is ruim: een gezonde Supabase antwoordt hierop in tientallen tot
 * enkele honderden milliseconden. De deadline hoort dus nooit te vuren als
 * alles werkt — vuurt hij tóch, dan is dat een signaal en geen ruis, en staat
 * het in de log.
 *
 * Let op de afweging: bij een overschrijding behandelen we de bezoeker als
 * uitgelogd. Voor een ingelogde gebruiker is dat even een verkeerde staat, maar
 * dat weegt niet op tegen een pagina die tien seconden niets doet. Zodra de
 * backend weer normaal antwoordt, klopt het beeld vanzelf weer.
 */

export const AUTH_DEADLINE_MS = 2500;

type AuthLike = {
  auth: {
    getUser: () => Promise<{ data: { user: unknown | null } }>;
  };
};

/**
 * Geeft de ingelogde gebruiker terug, of `null` als de auth-backend niet binnen
 * de deadline antwoordt. Gooit nooit.
 */
export async function getUserWithDeadline<T = unknown>(
  supabase: AuthLike,
  label: string,
  ms: number = AUTH_DEADLINE_MS,
): Promise<T | null> {
  let settled = false;

  const call = supabase.auth
    .getUser()
    .then(({ data }) => {
      settled = true;
      return (data?.user ?? null) as T | null;
    })
    .catch((err: unknown) => {
      settled = true;
      console.warn(`[auth] ${label} faalde: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    });

  const deadline = new Promise<T | null>((resolve) =>
    setTimeout(() => {
      if (!settled) {
        console.warn(`[auth] ${label} over de deadline van ${ms} ms — verder als uitgelogd`);
      }
      resolve(null);
    }, ms),
  );

  return Promise.race([call, deadline]);
}

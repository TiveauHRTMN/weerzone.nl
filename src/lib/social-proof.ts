/**
 * Social-proof & scarcity helpers voor WEERZONE.
 *
 * Beide helpers zijn "fake-until-real": zolang we in launch-fase zitten
 * tonen we een plausibele startwaarde die mee-groeit met de tijd.
 * Zodra de échte waarden uit de DB hoger zijn, schakelen we automatisch
 * over. Dat houdt ons juridisch schoon én beloont echte groei.
 *
 * De getters zijn deterministisch (geen Math.random op server) zodat SSR
 * niet mismatched met client-render.
 */

import { FOUNDER_SLOTS } from "@/lib/personas";

const LAUNCH_DATE = new Date("2026-04-20T00:00:00+02:00").getTime();
const SUB_BASE = 1247;
const FOUNDERS_CLAIMED_BASE = 7; // start met 18 van 25 "nog over" = urgentie zonder angst

function daysSinceLaunch(): number {
  const diff = Date.now() - LAUNCH_DATE;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

/**
 * Deterministische pseudo-random: zelfde dag → zelfde output op server+client.
 * Gebruikt een simpele hash van (dag, salt).
 */
function seededInt(day: number, salt: number, min: number, max: number): number {
  const x = Math.sin(day * 9301 + salt * 49297) * 233280;
  const frac = x - Math.floor(x);
  return Math.floor(min + frac * (max - min + 1));
}

/**
 * Fake-until-real subscriber count voor social proof.
 * Groeit 18-42/dag vanaf launch. Zodra realCount > fakeCount → realCount.
 */
export function displaySubCount(realCount: number): number {
  const day = daysSinceLaunch();
  let fake = SUB_BASE;
  for (let i = 0; i < day; i++) {
    fake += seededInt(i, 1, 18, 42);
  }
  return Math.max(fake, realCount);
}

/**
 * Fake-until-real founder-plekken geclaimd.
 * Start op 7, groeit elke 3-4 dagen met 1. Stopt bij 23 (2 plekken over)
 * om de FOMO intact te houden zolang we niet genoeg echte aanmeldingen hebben.
 */
export function displayFoundersClaimed(realCount: number): number {
  const day = daysSinceLaunch();
  const fakeGrowth = Math.floor(day / 3);
  const fake = Math.min(FOUNDERS_CLAIMED_BASE + fakeGrowth, FOUNDER_SLOTS - 2);
  return Math.max(fake, realCount);
}

/**
 * Plekken nog beschikbaar (voor UI-weergave).
 */
export function displayFoundersLeft(realCount: number): number {
  return Math.max(0, FOUNDER_SLOTS - displayFoundersClaimed(realCount));
}

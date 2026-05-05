/**
 * Social-proof helpers voor WEERZONE.
 *
 * We tonen hier geen verzonnen urgentie of fictieve aantallen.
 * De helpers geven de echte waarden door en laten de UI daarop bouwen.
 */

import { FOUNDER_SLOTS } from "@/lib/personas";

export function displaySubCount(realCount: number): number {
  return realCount;
}

export function displayFoundersClaimed(realCount: number): number {
  return realCount;
}

export function displayFoundersLeft(realCount: number): number {
  return Math.max(0, FOUNDER_SLOTS - realCount);
}

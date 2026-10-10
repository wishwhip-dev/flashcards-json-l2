/**
 * The scheduling rules and the calendar-day arithmetic they need.
 *
 * Rules:
 * - Again resets the card to due immediately (interval 0, due now — it reappears later in the same
 *   review session).
 * - Good on a new card schedules it for tomorrow; Good after that doubles the interval.
 * - Easy multiplies the interval by 2.5 and adds a day.
 *
 * Days are counted by local calendar date, never by dividing timestamps, so a daylight-saving
 * change cannot shift or repeat a day: `dayNumber` turns a moment into the count of local
 * midnights since the epoch, which are exact multiples of a day apart in UTC terms.
 */
import type { Card } from "@/lib/db";

export type Grade = "again" | "good" | "easy";

const DAY_MS = 86_400_000;
/** A card this old is counted as "mature" in the stats readout. */
export const MATURE_INTERVAL = 21;

/** Local midnights since the epoch — equal for two moments on the same local calendar day. */
export function dayNumber(ms: number): number {
  const d = new Date(ms);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
}

/** The millis at local midnight of the day `ms` falls in. */
export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function startOfTomorrow(now: number): number {
  return startOfLocalDay(now) + DAY_MS;
}

/** The interval, in whole days, the grade schedules from the card's current one. */
export function nextInterval(currentInterval: number, grade: Grade): number {
  if (grade === "again") return 0;
  if (grade === "good") return currentInterval === 0 ? 1 : currentInterval * 2;
  return Math.round(currentInterval * 2.5) + 1;
}

/** When a card graded `grade` at `now` next comes due. */
export function nextDueAt(currentInterval: number, grade: Grade, now: number): number {
  const interval = nextInterval(currentInterval, grade);
  if (grade === "again") return now;
  // The start of the due day, so the card is reviewable for that whole day.
  return startOfLocalDay(now) + interval * DAY_MS;
}

export function formatInterval(days: number): string {
  return `${days}d`;
}

/** The label the review button carries, e.g. "Good · 2d" — "Again · now" for an immediate reset. */
export function gradeLabel(grade: Grade, currentInterval: number): string {
  if (grade === "again") return "Again · now";
  return `${grade === "good" ? "Good" : "Easy"} · ${formatInterval(nextInterval(currentInterval, grade))}`;
}

/** How the card list and the empty states describe a due date. */
export function formatDue(dueAt: number, now: number): string {
  if (dueAt <= now) return "Due now";
  const days = dayNumber(dueAt) - dayNumber(now);
  if (days === 1) return "Tomorrow";
  return new Date(dueAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** How many of `cards` come due on each of the next `days` local days, starting today. */
export function duePerDay(cards: Card[], now: number, days: number): { day: string; due: number }[] {
  const today = dayNumber(now);
  const labels = [...Array(days)].map((_, i) => {
    const d = new Date(startOfLocalDay(now) + i * DAY_MS);
    return i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" });
  });
  const counts = [...Array(days)].map(() => 0);
  for (const card of cards) {
    const index = dayNumber(card.dueAt) - today;
    if (index >= 0 && index < days) counts[index] += 1;
  }
  return labels.map((day, i) => ({ day, due: counts[i] }));
}

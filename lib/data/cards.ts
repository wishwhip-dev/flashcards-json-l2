/**
 * The app's data-access functions. Components call these, never Dexie directly.
 */
import { database, newId, type Card } from "@/lib/db";
import { nextDueAt, nextInterval, startOfTomorrow, type Grade } from "@/lib/srs";

const table = async () => (await database.ready()).cards;

export async function listCards(): Promise<Card[]> {
  const cards = await (await table()).toArray();
  return cards.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

/** The cards whose due date has arrived. */
export async function dueCards(now: number): Promise<Card[]> {
  return (await table()).where("dueAt").belowOrEqual(now).toArray();
}

/** The earliest due date still in the future, or undefined when nothing is pending. */
export async function nextPendingDue(now: number): Promise<number | undefined> {
  const next = await (await table()).where("dueAt").above(now).first();
  return next?.dueAt;
}

export async function addCard(front: string, back: string, now = Date.now()): Promise<Card> {
  const card: Card = {
    id: newId(),
    front,
    back,
    interval: 0,
    dueAt: now, // a new card is reviewable straight away
    createdAt: now,
  };
  await (await table()).add(card);
  return card;
}

/** Two cards are the same card when both sides match, ignoring case and edge whitespace. */
function cardKey(front: string, back: string): string {
  return `${front.trim().toLowerCase()}\u0000${back.trim().toLowerCase()}`;
}

/**
 * Add a batch of {front, back} cards, skipping any that duplicate a card already in the deck or
 * another card in the same batch. Written in one bulkAdd, so a deck of several hundred loads in a
 * single transaction.
 */
export async function addCards(
  incoming: { front: string; back: string }[],
): Promise<{ added: number; skipped: number }> {
  const table_ = await table();
  const existing = new Set((await table_.toArray()).map((c) => cardKey(c.front, c.back)));
  const rows: Card[] = [];
  let skipped = 0;
  const now = Date.now();
  for (const { front, back } of incoming) {
    const key = cardKey(front, back);
    if (existing.has(key)) {
      skipped += 1;
      continue;
    }
    existing.add(key);
    rows.push({ id: newId(), front, back, interval: 0, dueAt: now, createdAt: now + rows.length });
  }
  if (rows.length) await table_.bulkAdd(rows);
  return { added: rows.length, skipped };
}

export async function deleteCard(id: string): Promise<void> {
  await (await table()).delete(id);
}

/** Apply a review grade: recompute the interval and due date and write them back. */
export async function gradeCard(card: Card, grade: Grade, now = Date.now()): Promise<Card> {
  const updated: Card = {
    ...card,
    interval: nextInterval(card.interval, grade),
    dueAt: nextDueAt(card.interval, grade, now),
  };
  await (await table()).put(updated);
  return updated;
}

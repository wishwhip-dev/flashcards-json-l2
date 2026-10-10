/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, how the schema has changed over
 * time, and what a first visit starts with.
 */
import { defineDatabase } from "@/lib/storage/database";

/** One flashcard. `interval` is the current scheduling interval in whole days (0 = new card). */
export type Card = {
  id: string;
  front: string;
  back: string;
  /** Current interval, in days. 0 means the card has never been graded. */
  interval: number;
  /**
   * Epoch millis of the start of the local day the card next comes due. A card due "immediately"
   * carries a timestamp in the past or now.
   */
  dueAt: number;
  createdAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ cards: Card }>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place. That is exactly
  // what you want on a first build, and never what you want afterwards.
  name: "flashcard-deck",
  versions: [
    // Only the primary key and the properties queried on. `dueAt` drives every "is this due" read
    // and the 7-day chart; the text fields are stored but never filtered or sorted by.
    { version: 1, stores: { cards: "id, dueAt" } },
  ],
  // No seed: a deck with zero cards is a real state this app is built to show.
});

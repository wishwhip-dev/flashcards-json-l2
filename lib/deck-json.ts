/**
 * Reading a deck out of a JSON file.
 *
 * Two shapes are accepted:
 * - a bare array of {front, back} objects: `[{"front": "…", "back": "…"}, …]`
 * - an object holding that array under `cards`: `{"cards": [...]}`
 *
 * Anything else throws with a message that names the expected shape, so the page can show it and
 * leave the existing deck untouched.
 */
export type RawCard = { front: string; back: string };

const SHAPE_HINT =
  "Expected a JSON array of cards like {\"front\": \"…\", \"back\": \"…\"}, or an object with a \"cards\" array of that shape — both fields must be non-empty strings.";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function collect(value: unknown): { cards: RawCard[]; invalid: number } {
  const entries: unknown[] = Array.isArray(value)
    ? value
    : value !== null && typeof value === "object" && Array.isArray((value as { cards?: unknown }).cards)
      ? ((value as { cards: unknown[] }).cards)
      : null;

  if (!entries) throw new Error(SHAPE_HINT);

  const cards: RawCard[] = [];
  let invalid = 0;
  for (const entry of entries) {
    if (
      entry !== null &&
      typeof entry === "object" &&
      isNonEmptyString((entry as { front?: unknown }).front) &&
      isNonEmptyString((entry as { back?: unknown }).back)
    ) {
      cards.push({ front: (entry as { front: string }).front.trim(), back: (entry as { back: string }).back.trim() });
    } else {
      invalid += 1;
    }
  }
  return { cards, invalid };
}

/**
 * Parse the parsed JSON of a deck file. Throws when the file is not in either accepted shape, and
 * when it holds no valid cards at all. Entries with an empty or missing side are reported in the
 * error but the valid ones are still returned, so a mostly-good file is not thrown away whole.
 */
export function parseDeck(value: unknown, filename: string): RawCard[] {
  const { cards, invalid } = collect(value);
  if (!cards.length) {
    throw new Error(
      invalid
        ? `${filename} holds no cards this app can read — all ${invalid} entries were missing a "front" or a "back". ${SHAPE_HINT}`
        : `${filename} holds no cards this app can read. ${SHAPE_HINT}`,
    );
  }
  if (invalid) {
    throw new Error(
      `${filename} holds ${cards.length} usable card${cards.length === 1 ? "" : "s"}, but ${invalid} ${invalid === 1 ? "entry was" : "entries were"} missing a "front" or a "back". Fix them and load again — nothing has been added yet.`,
    );
  }
  return cards;
}

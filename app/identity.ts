/**
 * What this app is called and how it looks when shared: the page title, the description search
 * engines and link previews show, the colour of the icon and the browser bar, and the letter on
 * the icon. The layout, the icons, the manifest and the share image all read from here, so a
 * change here reaches every one of them. Keep `name` short and `description` one plain sentence.
 */
export const identity = {
  name: "Recall Deck",
  description:
    "Spaced-repetition flashcards: type your own cards or load a deck from a JSON file, then review what is due today with again, good and easy scheduling.",
  accent: "#1d4ed8",
  initial: "R",
} as const;

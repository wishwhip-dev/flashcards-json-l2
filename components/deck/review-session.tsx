"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database, type Card } from "@/lib/db";
import { dueTodayCards, gradeCard } from "@/lib/data/cards";
import { gradeLabel, type Grade } from "@/lib/srs";
import { useStoredQuery } from "@/lib/storage/react";

const GRADES: { grade: Grade; key: string }[] = [
  { grade: "again", key: "1" },
  { grade: "good", key: "2" },
  { grade: "easy", key: "3" },
];

/**
 * One review session over the due cards that were handed to it. The card flips on click or Space;
 * Again, Good and Easy (keys 1, 2, 3) schedule it and move on. Again sends the card to the back of
 * the queue so it reappears later in the same session. The queue is a snapshot: cards graded Good
 * or Easy are out of it for good, which is what "due" means.
 */
export function ReviewSession({ dueCards: queue, onExit }: { dueCards: Card[]; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [extra, setExtra] = useState<Card[]>([]); // Again-ed cards, appended so they come round again
  const [flipped, setFlipped] = useState(false);
  const [counts, setCounts] = useState<Record<Grade, number>>({ again: 0, good: 0, easy: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const full = [...queue, ...extra];
  const done = index >= full.length;
  const current = full[index];

  const grade = useEffectEvent(async (g: Grade) => {
    if (!current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await gradeCard(current, g, Date.now());
      setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
      if (g === "again") setExtra((e) => [...e, updated]); // due immediately: it comes round again
      setFlipped(false);
      setIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that grade — the card was not moved on.");
    } finally {
      setBusy(false);
    }
  });

  const flip = useEffectEvent(() => {
    if (!current) return;
    setFlipped((f) => !f);
  });

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (done) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
    if (event.code === "Space" || event.key === " ") {
      event.preventDefault();
      flip();
    } else if (event.key === "1") {
      void grade("again");
    } else if (event.key === "2") {
      void grade("good");
    } else if (event.key === "3") {
      void grade("easy");
    }
  });

  // The listener is registered once; useEffectEvent keeps the handler it calls current.
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onKey]);

  if (done) {
    return <SessionSummary counts={counts} onExit={onExit} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reviewing</CardTitle>
        <p className="text-sm text-muted-foreground">
          Card {index + 1} of {full.length} · {full.length - index - 1} after this one
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <button
          type="button"
          onClick={flip}
          aria-label={flipped ? "Show the front of the card" : "Show the back of the card"}
          className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-accent/40 px-6 py-10 text-center transition-colors hover:bg-accent/70 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {flipped ? "Back" : "Front"}
          </span>
          <span className="text-2xl font-semibold text-balance sm:text-3xl">{flipped ? current.back : current.front}</span>
          <span className="text-xs text-muted-foreground">Click, or press Space, to flip</span>
        </button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {flipped ? (
          <div className="grid grid-cols-3 gap-2">
            {GRADES.map(({ grade: g, key }) => (
              <Button key={g} variant={g === "again" ? "outline" : "default"} disabled={busy} onClick={() => void grade(g)}>
                <span>{gradeLabel(g, current.interval)}</span>
                <kbd className="ms-1 rounded border bg-background/60 px-1 font-sans text-[10px]">{key}</kbd>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">Reveal the card to grade it.</p>
        )}
      </CardContent>
    </Card>
  );
}

function SessionSummary({ counts, onExit }: { counts: Record<Grade, number>; onExit: () => void }) {
  // Re-read after the session's last write: Again-ed cards are due again right now.
  const stillDue = useStoredQuery(database, () => dueTodayCards(Date.now()));
  const total = counts.again + counts.good + counts.easy;
  const dueCount = stillDue.data?.length ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Session finished</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {GRADES.map(({ grade: g }) => (
            <div key={g} className="rounded-lg border bg-accent/30 px-2 py-3">
              <p className="text-2xl font-semibold">{counts[g]}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{g}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          You answered {total} {total === 1 ? "card" : "cards"}.{" "}
          {stillDue.isLoading
            ? "Counting what is still due today…"
            : `${dueCount} ${dueCount === 1 ? "card is" : "cards are"} still due today.`}
        </p>
        <Button onClick={onExit}>Back to deck</Button>
      </CardContent>
    </Card>
  );
}
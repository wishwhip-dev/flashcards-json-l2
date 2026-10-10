"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { database, type Card } from "@/lib/db";
import { dueCards, listCards, nextPendingDue } from "@/lib/data/cards";
import { formatDue } from "@/lib/srs";
import { useStorageStatus, useStoredQuery } from "@/lib/storage/react";
import { AddCardForm } from "@/components/deck/add-card-form";
import { CardList } from "@/components/deck/card-list";
import { DeckStats } from "@/components/deck/deck-stats";
import { LoadDeckDialog } from "@/components/deck/load-deck-dialog";
import { ReviewSession } from "@/components/deck/review-session";

/**
 * The whole deck on one page: the readouts and the three actions up top, then the review area, the
 * add-card form, the card list and the stats. Everything the visitor does stays in this column.
 */
export function DeckApp() {
  const deck = useStoredQuery(database, () => listCards());
  const nextDue = useStoredQuery(database, () => nextPendingDue(Date.now()));
  const status = useStorageStatus(database);

  const [adding, setAdding] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const [session, setSession] = useState<Card[] | null>(null); // null = not reviewing

  const cards = deck.data ?? [];
  const now = Date.now();
  const dueCount = cards.filter((card) => card.dueAt <= now).length;

  const startReview = async () => {
    try {
      const due = await dueCards(Date.now());
      if (!due.length) {
        toast.info(`Nothing is due right now${nextDue.data ? ` — next card due ${formatDue(nextDue.data, Date.now())}` : ""}.`);
        return;
      }
      setSession(due);
      document.getElementById("review-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the review session.");
    }
  };

  return (
    <div className="space-y-6">
      {status === "memory" && (
        <Alert>
          <AlertTitle>This browser will not keep your deck</AlertTitle>
          <AlertDescription>
            Storage was refused here, so the app is running on a temporary stand-in: everything works,
            but the deck is gone when this tab closes.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="text-2xl">Your deck</CardTitle>
          <p className="text-sm text-muted-foreground">
            {deck.isLoading
              ? "Opening your deck…"
              : `${cards.length} ${cards.length === 1 ? "card" : "cards"} · ${dueCount} due now`}
          </p>
        </CardHeader>
        <CardContent>
          {deck.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-3">
              <Button aria-expanded={adding} onClick={() => setAdding((a) => !a)}>
                Add card
              </Button>
              <Button variant="secondary" onClick={() => void startReview()}>
                Review due cards
                {dueCount > 0 && <Badge className="ms-2">{dueCount}</Badge>}
              </Button>
              <Button variant="outline" onClick={() => setLoadOpen(true)}>
                Load JSON deck
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div id="review-area" className="scroll-mt-4">
        {session !== null ? (
          <ReviewSession dueCards={session} onExit={() => setSession(null)} />
        ) : deck.isLoading ? null : cards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="space-y-3 py-8 text-center">
              <p className="text-lg font-semibold">Your deck is empty</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Add your first card with the form above, or load a whole deck from a JSON file on
                your computer — a list of <code className="text-xs">{"{front, back}"}</code> objects.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  onClick={() => {
                    setAdding(true);
                    document.getElementById("add-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Add your first card
                </Button>
                <Button variant="outline" onClick={() => setLoadOpen(true)}>
                  Load a JSON deck
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : dueCount === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <p className="font-semibold">All caught up — nothing is due right now.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {nextDue.isLoading
                  ? "Working out when the next card comes due…"
                  : nextDue.data
                    ? `The next card comes due ${formatDue(nextDue.data, now)}.`
                    : "No card has a review scheduled."}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {adding && (
        <div id="add-area" className="scroll-mt-4">
          <AddCardForm onAdded={() => setLoadMessage(null)} />
        </div>
      )}

      <section className="space-y-3" aria-labelledby="deck-heading">
        <div className="flex items-center justify-between gap-2">
          <h2 id="deck-heading" className="text-lg font-semibold">
            Cards
          </h2>
          <Badge variant="secondary">{cards.length}</Badge>
        </div>
        {loadMessage && (
          <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium">
            {loadMessage}
          </p>
        )}
        {deck.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cards yet. Add one above or load a JSON deck.</p>
        ) : (
          <CardList cards={cards} now={now} />
        )}
      </section>

      <DeckStats cards={cards} now={now} />

      <LoadDeckDialog
        open={loadOpen}
        onOpenChange={setLoadOpen}
        onLoaded={(message) => {
          setLoadMessage(message);
          document.getElementById("deck-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    </div>
  );
}
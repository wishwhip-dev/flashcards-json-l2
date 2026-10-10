"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { database, type Card } from "@/lib/db";
import { deleteCard } from "@/lib/data/cards";
import { formatDue, formatInterval } from "@/lib/srs";

/** Every card in the deck, with its interval and due date, and a delete that asks first. */
export function CardList({ cards, now }: { cards: Card[]; now: number }) {
  const [pendingDelete, setPendingDelete] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCard(pendingDelete.id);
      toast.success(`Deleted “${truncate(pendingDelete.front)}”.`);
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete the card.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ul className="space-y-2">
        {cards.map((card) => (
          <li key={card.id} className="rounded-lg border bg-card px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium break-words">{card.front}</p>
                <p className="text-sm text-muted-foreground break-words">{card.back}</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setPendingDelete(card)}>
                Delete
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={card.interval === 0 ? "secondary" : "outline"}>
                {card.interval === 0 ? "New" : `Interval · ${formatInterval(card.interval)}`}
              </Badge>
              <Badge variant={card.dueAt <= now ? "default" : "outline"}>{formatDue(card.dueAt, now)}</Badge>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this card?</DialogTitle>
            <DialogDescription>
              “{truncate(pendingDelete?.front ?? "")}” will be removed from the deck, along with its
              scheduling. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              Delete card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function truncate(text: string): string {
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}
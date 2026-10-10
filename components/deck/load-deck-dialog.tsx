"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileDrop } from "@/components/file-drop";
import { readAsJson } from "@/lib/files";
import { parseDeck } from "@/lib/deck-json";
import { addCards } from "@/lib/data/cards";

/**
 * The "Load JSON deck" flow: the shipped FileDrop inside a dialog. The file is parsed and checked
 * before anything is written, so a bad file leaves the existing deck untouched and its message says
 * what shape was expected instead.
 */
export function LoadDeckDialog({ open, onOpenChange, onLoaded }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoaded: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = async ([file]: File[]) => {
    if (!file) return; // rejections are already listed under the drop zone
    setWorking(true);
    setError(null);
    try {
      const deck = parseDeck(await readAsJson(file), file.name);
      const { added, skipped } = await addCards(deck);
      const message = `Loaded ${added} ${added === 1 ? "card" : "cards"}${
        skipped ? `, ${skipped} skipped as duplicates of cards already in the deck` : ""
      }.`;
      onLoaded(message);
      toast.success(message);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : `Could not read ${file.name}.`;
      setError(message);
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load a JSON deck</DialogTitle>
          <DialogDescription>
            Cards come in as new cards, due for review straight away. Cards already in the deck are
            kept — duplicates in the file are skipped.
          </DialogDescription>
        </DialogHeader>
        <FileDrop
          accept="application/json,.json"
          maxBytes={5 * 1024 * 1024}
          label="Choose JSON file"
          disabled={working}
          onFiles={(files) => void load(files)}
        >
          or drop a .json file here (up to 5 MB)
        </FileDrop>
        <p className="text-sm text-muted-foreground">
          The file is either a list of cards — <code className="text-xs">[{"{front, back}"}, …]</code> — or an object
          holding that list under <code className="text-xs">cards</code>. Both sides must be non-empty strings.
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
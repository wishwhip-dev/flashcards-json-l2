"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addCard } from "@/lib/data/cards";

/**
 * The "Add card" form. Submitting with both sides filled adds the card and clears the fields so the
 * next one can be typed straight away; an empty side shows an inline error and adds nothing.
 */
export function AddCardForm({ onAdded }: { onAdded: (front: string) => void }) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [working, setWorking] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: { front?: string; back?: string } = {};
    if (!front.trim()) next.front = "The front needs some text.";
    if (!back.trim()) next.back = "The back needs some text.";
    setErrors(next);
    if (next.front || next.back) return;
    setWorking(true);
    try {
      await addCard(front.trim(), back.trim());
      setFront("");
      setBack("");
      onAdded(front.trim());
      toast.success("Card added — it is due for review right away.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the card.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add a card</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void submit(e)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="card-front">Front</Label>
            <Textarea
              id="card-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="What shows first — the question, word or prompt"
              rows={2}
              aria-invalid={errors.front ? true : undefined}
              aria-describedby={errors.front ? "card-front-error" : undefined}
            />
            {errors.front && (
              <p id="card-front-error" role="alert" className="text-sm text-destructive">
                {errors.front}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-back">Back</Label>
            <Textarea
              id="card-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="What is revealed — the answer"
              rows={2}
              aria-invalid={errors.back ? true : undefined}
              aria-describedby={errors.back ? "card-back-error" : undefined}
            />
            {errors.back && (
              <p id="card-back-error" role="alert" className="text-sm text-destructive">
                {errors.back}
              </p>
            )}
          </div>
          <Button type="submit" disabled={working} className="min-w-40">
            Save card
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
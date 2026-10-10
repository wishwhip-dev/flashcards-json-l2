import { DeckApp } from "@/components/deck/deck-app";
import { identity } from "@/app/identity";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{identity.name}</h1>
        <p className="text-muted-foreground">
          Type your own cards or load a deck from a JSON file, then review what is due today.
        </p>
      </header>
      <DeckApp />
    </main>
  );
}
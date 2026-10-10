"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Card as DeckCard } from "@/lib/db";
import { duePerDay, MATURE_INTERVAL, startOfTomorrow } from "@/lib/srs";

const config = { due: { label: "Due", color: "var(--chart-1)" } } satisfies ChartConfig;

/** How many cards come due on each of the next 7 days, plus the deck's headline numbers. */
export function DeckStats({ cards, now }: { cards: DeckCard[]; now: number }) {
  const data = duePerDay(cards, now, 7);
  const dueToday = cards.filter((c) => c.dueAt < startOfTomorrow(now)).length;
  const mature = cards.filter((c) => c.interval >= MATURE_INTERVAL).length;

  const readouts = [
    { label: "Total cards", value: cards.length },
    { label: "Due today", value: dueToday },
    { label: `Interval ${MATURE_INTERVAL}d or more`, value: mature },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deck stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {readouts.map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-accent/30 px-2 py-3">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Due over the next 7 days</p>
          <ChartContainer config={config} className="h-44 w-full">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="due" fill="var(--color-due)" radius={4} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
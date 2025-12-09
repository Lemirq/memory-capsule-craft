"use client";

import React from "react";

interface Theme {
  name: string;
  count: number;
}

interface ThemesBubbleChartProps {
  themes: Theme[];
}

const COLORS = [
  "bg-red-200 text-red-800",
  "bg-orange-200 text-orange-800",
  "bg-amber-200 text-amber-800",
  "bg-yellow-200 text-yellow-800",
  "bg-lime-200 text-lime-800",
  "bg-green-200 text-green-800",
  "bg-emerald-200 text-emerald-800",
  "bg-teal-200 text-teal-800",
  "bg-cyan-200 text-cyan-800",
  "bg-sky-200 text-sky-800",
  "bg-blue-200 text-blue-800",
  "bg-indigo-200 text-indigo-800",
  "bg-violet-200 text-violet-800",
  "bg-purple-200 text-purple-800",
  "bg-fuchsia-200 text-fuchsia-800",
  "bg-pink-200 text-pink-800",
  "bg-rose-200 text-rose-800",
];

export default function ThemesBubbleChart({ themes }: ThemesBubbleChartProps) {
  if (!themes || themes.length === 0) {
    return <div className="text-center text-muted-foreground py-10">No themes found yet.</div>;
  }

  // Sort by count descending
  const sortedThemes = [...themes].sort((a, b) => b.count - a.count).slice(0, 20);
  const maxCount = Math.max(...sortedThemes.map(t => t.count));
  const minCount = Math.min(...sortedThemes.map(t => t.count));

  // Simple size normalization
  const getSize = (count: number) => {
    if (maxCount === minCount) return 100; // Default size if all same
    const minSize = 60;
    const maxSize = 150;
    return minSize + ((count - minCount) / (maxCount - minCount)) * (maxSize - minSize);
  };

  return (
    <div className="w-full h-[300px] overflow-hidden relative flex flex-wrap justify-center items-center gap-4 p-4">
      {sortedThemes.map((theme, index) => {
        const size = getSize(theme.count);
        const colorClass = COLORS[index % COLORS.length];
        
        return (
          <div
            key={theme.name}
            className={`rounded-full flex items-center justify-center text-center font-medium shadow-sm transition-transform hover:scale-110 cursor-default ${colorClass}`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              fontSize: `${Math.max(10, size / 5)}px`,
              zIndex: Math.floor(theme.count),
            }}
            title={`${theme.name}: ${theme.count}`}
          >
            {theme.name}
          </div>
        );
      })}
    </div>
  );
}

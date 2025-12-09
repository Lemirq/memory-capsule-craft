"use client";

import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DailyMood {
  date: string;
  mood: number;
}

interface StreakTimelineProps {
  dailyMoods: DailyMood[];
}

export default function StreakTimeline({ dailyMoods }: StreakTimelineProps) {
  // Generate last 30 days
  const days = [];
  const today = new Date();
  
  // Create a map for quick lookup
  const moodMap = new Map<string, number>();
  dailyMoods.forEach(d => {
    const dateStr = new Date(d.date).toISOString().split('T')[0];
    moodMap.set(dateStr, d.mood);
  });

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const mood = moodMap.get(dateStr);
    
    days.push({
      date: d,
      dateStr,
      mood,
      hasEntry: mood !== undefined
    });
  }

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return "bg-green-500";
    if (mood >= 6) return "bg-lime-500";
    if (mood >= 4) return "bg-yellow-500";
    if (mood >= 3) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end gap-1 h-12">
        {days.map((day, index) => (
          <TooltipProvider key={day.dateStr}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`w-full rounded-sm transition-all hover:opacity-80 ${
                    day.hasEntry 
                      ? `${getMoodColor(day.mood!)} h-8` 
                      : "bg-muted h-2 mb-3"
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                <p className="text-xs text-muted-foreground">
                  {day.hasEntry ? `Mood: ${day.mood}/10` : "No entry"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>30 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

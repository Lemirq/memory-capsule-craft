"use client";

import { useEffect, useState } from "react";
import { CraftClient, type CraftBlock, type CraftTextBlock } from "@/lib/craft-api";
import { getSettings } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar, Smile } from "lucide-react";

export default function JournalsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournals = async () => {
      const settings = getSettings();
      if (!settings?.craftToken) {
        setLoading(false);
        return;
      }

      try {
        const client = new CraftClient(settings.craftToken);
        const docs = await client.listDocuments();
        const journalsDoc = docs.find(d => d.title === "Journals" && !d.isDeleted);

        if (journalsDoc) {
          // Fetch children (entries)
          // We don't need deep content for the list, just the blocks to get IDs and Titles (dates)
          // But to show a preview or mood, we might need depth=1 or 2.
          // Let's try depth 2 to see if we can peek at content.
          const journalBlock = await client.getBlock(journalsDoc.id, 2);
          
          if (journalBlock.content) {
            const processed = journalBlock.content
              .filter(b => b.type === "page")
              .map(b => {
                // Try to find mood in content if available
                let mood = null;
                const insightsBlock = b.content?.find(c => c.type === "text" && (c as CraftTextBlock).markdown?.includes("Memory Capsule Insights") && (c as CraftTextBlock).listStyle === "toggle");
                
                if (insightsBlock && insightsBlock.content?.[0]) {
                   const jsonBlock = insightsBlock.content[0];
                   let jsonStr = "";
                   
                   if (jsonBlock.type === "code") {
                       jsonStr = (jsonBlock as any).rawCode || (jsonBlock as any).code;
                   } else if (jsonBlock.type === "text" && (jsonBlock as CraftTextBlock).markdown?.includes("```json")) {
                       const match = (jsonBlock as CraftTextBlock).markdown!.match(/```json\n([\s\S]*?)\n```/);
                       if (match) jsonStr = match[1];
                   }

                   if (jsonStr) {
                     try {
                       const data = JSON.parse(jsonStr);
                       if (data.moodScore) mood = data.moodScore;
                     } catch (e) {
                       // ignore
                     }
                   }
                }
                return {
                  id: b.id,
                  date: (b as CraftTextBlock).markdown, // Title is in markdown field for pages usually
                  mood
                };
              })
              // Sort by date descending
              .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
            
            setEntries(processed);
          }
        }
      } catch (error) {
        console.error("Failed to fetch journals", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJournals();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Journals</h1>
          <p className="text-muted-foreground">
            Your collection of memories and insights.
          </p>
        </div>
        <Link href="/journal">
          <Button>
            Process New Entry
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Link key={entry.id} href={`/journals/${entry.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {entry.date}
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  {entry.mood ? (
                    <>
                      <Smile className="mr-2 h-4 w-4 text-primary" />
                      Mood: {entry.mood}/10
                    </>
                  ) : (
                    <span className="italic">Not processed yet</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {entries.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No journal entries found. Start by creating a page in your "Journals" document in Craft.
          </div>
        )}
      </div>
    </div>
  );
}

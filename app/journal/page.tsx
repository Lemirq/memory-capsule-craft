"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CraftClient, type CraftDocument, type CraftBlock, type CraftTextBlock } from "@/lib/craft-api";
import { DashboardManager } from "@/lib/dashboard-manager";
import { LLMService, type JournalAnalysis } from "@/lib/llm-service";
import { getSettings } from "@/lib/storage";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function JournalPage() {
  const [entries, setEntries] = useState<CraftBlock[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [journalsDocId, setJournalsDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      const settings = getSettings();
      if (!settings?.craftToken) {
        setError("Please configure your Craft API token in Settings.");
        return;
      }

      setLoading(true);
      try {
        const client = new CraftClient(settings.craftToken);
        
        // 1. Find "Journals" document
        const docs = await client.listDocuments();
        const journalsDoc = docs.find(d => d.title === "Journals" && !d.isDeleted);
        
        if (!journalsDoc) {
          setError("Could not find a document named 'Journals'. Please create one.");
          return;
        }
        setJournalsDocId(journalsDoc.id);

        // 2. Fetch children of "Journals"
        // maxDepth=2 to get the children's content for stale check
        const journalBlock = await client.getBlock(journalsDoc.id, 2);
        
        if (!journalBlock.content) {
          setEntries([]);
          return;
        }

        // 3. Filter for stale entries (pages that don't have "Memory Capsule Insights")
        const staleEntries = journalBlock.content.filter(block => {
          // Only process pages (which are usually text blocks with page style or actual page type if API returns it)
          // But our types say 'page' is a type.
          if (block.type !== "page" && (block.type !== "text" || (block as CraftTextBlock).textStyle !== "page")) return false; 
          
          // Check if it has already been processed
          // We look for a block with the specific header text
          const hasInsights = block.content?.some(child => 
            child.type === "text" && (child as CraftTextBlock).markdown?.includes("Memory Capsule Insights") && (child as CraftTextBlock).listStyle === "toggle"
          );
          
          return !hasInsights;
        });

        setEntries(staleEntries);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch journal entries. Check your API token.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const processEntry = async (entryId: string, client: CraftClient, llm: LLMService) => {
    // 1. Fetch full entry content
    const entryBlock = await client.getBlock(entryId, 5);
    
    // Extract text from the entry
    const extractText = (blocks: CraftBlock[]): string => {
      return blocks.map(b => {
        const text = (b.type === "text" ? (b as CraftTextBlock).markdown : "") || "";
        const childrenText = b.content ? extractText(b.content) : "";
        return `${text}\n${childrenText}`;
      }).join("\n");
    };
    
    const text = entryBlock.content ? extractText(entryBlock.content) : "";

    // 2. Analyze with LLM
    const result = await llm.analyzeEntry(text);

    // 3. Write back to Craft
    // 3. Write back to Craft as JSON code block
    const jsonContent = JSON.stringify(result, null, 2);
    const markdown = `
# Memory Capsule Insights

\`\`\`json
${jsonContent}
\`\`\`
`;

    await client.insertBlocks(entryId, [
      {
        type: "text",
        markdown: "Memory Capsule Insights",
        textStyle: "body",
        listStyle: "toggle"
      },
      {
        type: "code",
        rawCode: jsonContent,
        language: "json",
        indentationLevel: 1
      }
    ]);

    // Update Dashboard Index
    try {
        if (journalsDocId) {
            const dashboardManager = new DashboardManager(client, journalsDocId);
            const currentData = await dashboardManager.getDashboardData() || {
                totalEntries: 0,
                avgMood: "0",
                streak: 0,
                themes: [],
                dailyMoods: [],
                lastUpdated: new Date().toISOString()
            };

        // Update stats
        const newTotalEntries = currentData.totalEntries + 1;
        
        // Update avg mood
        const currentTotalMood = parseFloat(currentData.avgMood) * currentData.totalEntries;
        const newMood = result.mood || 0;
        const newAvgMood = ((currentTotalMood + newMood) / newTotalEntries).toFixed(1);

        // Update themes
        const newThemes = [...currentData.themes];
        if (result.themes) {
            result.themes.forEach((t: string) => {
                const existing = newThemes.find(th => th.name === t);
                if (existing) {
                    existing.count++;
                } else {
                    newThemes.push({ name: t, count: 1 });
                }
            });
        }
        newThemes.sort((a, b) => b.count - a.count); // Keep sorted

        // Update daily moods
        const newDailyMoods = [...currentData.dailyMoods];
        
        // Find entry to get date
        const entry = entries.find(e => e.id === entryId);
        
        if (entry && (entry as CraftTextBlock).markdown && result.mood) {
             // Assuming markdown title is date
             const dateStr = (entry as CraftTextBlock).markdown || "";
             newDailyMoods.push({ date: dateStr, mood: result.mood });
        }
        
        // Recalculate streak (simplified: just check if we have consecutive days in newDailyMoods)
        // Or just increment if today is consecutive? 
        // Let's do a proper streak calc from dailyMoods
        const uniqueDates = Array.from(new Set(newDailyMoods.map(m => new Date(m.date).toDateString()))).map(d => new Date(d).getTime()).sort((a, b) => b - a);
        let streak = 0;
        if (uniqueDates.length > 0) {
            streak = 1;
            let currentDate = uniqueDates[0];
            for (let i = 1; i < uniqueDates.length; i++) {
                const diff = (currentDate - uniqueDates[i]) / (1000 * 60 * 60 * 24);
                if (diff <= 1.5) { // Allow some slack for timezones, basically 1 day diff
                    streak++;
                    currentDate = uniqueDates[i];
                } else {
                    break;
                }
            }
        }

        await dashboardManager.updateDashboardData({
            totalEntries: newTotalEntries,
            avgMood: newAvgMood,
            streak: streak,
            themes: newThemes,
            dailyMoods: newDailyMoods,
            lastUpdated: new Date().toISOString()
        });

        }
    } catch (e) {
        console.error("Failed to update dashboard index", e);
        // Don't fail the whole process if dashboard update fails
    }

    return result;
  };

  const handleProcess = async () => {
    if (!selectedEntryId) return;

    const settings = getSettings();
    if (!settings?.craftToken || !settings?.openaiKey) {
      setError("Missing API keys. Please check Settings.");
      return;
    }

    setProcessing(true);
    setProcessingStatus("Processing entry...");
    setError(null);
    setSuccess(false);

    try {
      const client = new CraftClient(settings.craftToken);
      const llm = new LLMService(settings.openaiKey);

      const result = await processEntry(selectedEntryId, client, llm);
      
      setAnalysis(result);
      setSuccess(true);
      
      // Remove from list
      setEntries(prev => prev.filter(e => e.id !== selectedEntryId));
      setSelectedEntryId(null);

    } catch (err) {
      console.error(err);
      setError("Failed to process entry. See console for details.");
    } finally {
      setProcessing(false);
      setProcessingStatus(null);
    }
  };

  const handleProcessAll = async () => {
    if (entries.length === 0) return;

    const settings = getSettings();
    if (!settings?.craftToken || !settings?.openaiKey) {
      setError("Missing API keys. Please check Settings.");
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(false);
    setAnalysis(null); // Clear previous analysis

    try {
      const client = new CraftClient(settings.craftToken);
      const llm = new LLMService(settings.openaiKey);

      const total = entries.length;
      let processedCount = 0;

      // Create a copy of entries to iterate over
      const entriesToProcess = [...entries];

      for (const entry of entriesToProcess) {
        processedCount++;
        const title = (entry.type === "text" ? (entry as CraftTextBlock).markdown : "") || "Untitled";
        setProcessingStatus(`Processing ${processedCount} of ${total}: ${title}...`);
        
        try {
          if (!entry.id) {
            console.error("Entry has no ID, skipping:", entry);
            continue;
          }
          await processEntry(entry.id, client, llm);
          
          // Remove from list immediately after success
          setEntries(prev => prev.filter(e => e.id !== entry.id));
          
          // Small delay to be nice to APIs
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Failed to process entry ${entry.id}`, err);
          // Continue with next entry even if one fails
        }
      }

      setSuccess(true);
      setProcessingStatus("Batch processing complete!");
      setTimeout(() => setProcessingStatus(null), 3000);

    } catch (err) {
      console.error(err);
      setError("Batch processing failed. See console for details.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Process Journal Entry</h1>
        <p className="text-muted-foreground">
          Select a journal entry to analyze. Only unprocessed entries are shown.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>Unprocessed Entries</CardTitle>
              <CardDescription>
                Found {entries.length} entries waiting.
              </CardDescription>
            </div>
            {entries.length > 1 && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleProcessAll}
                disabled={processing}
              >
                Process All
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {entries.map((entry) => {
                    console.log(entry)
                    return (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedEntryId === entry.id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent"
                    }`}
                    onClick={() => !processing && entry.id && setSelectedEntryId(entry.id)}
                  >
                    <div className="font-medium">{(entry.type === "page" ? (entry as CraftTextBlock).markdown : "") || "Untitled Entry"}</div>
                    <div className="text-xs text-muted-foreground truncate">{entry.id}</div>
                  </div>
                )})}
                {entries.length === 0 && !error && (
                  <p className="text-center text-muted-foreground py-4">
                    All caught up! No new entries found.
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              disabled={!selectedEntryId || processing}
              onClick={handleProcess}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingStatus || "Processing..."}
                </>
              ) : (
                "Process Entry"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Insights generated by AI will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processing && processingStatus ? (
               <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center space-y-4">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p>{processingStatus}</p>
               </div>
            ) : success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  {analysis ? "Successfully updated Craft document!" : "Batch processing complete!"}
                </div>
                {analysis && (
                  <div className="space-y-4 text-sm">
                    <div>
                      <span className="font-semibold">Summary:</span> {analysis.summary}
                    </div>
                    <div className="flex gap-4">
                      <div><span className="font-semibold">Mood:</span> {analysis.mood}/10</div>
                      <div><span className="font-semibold">Stress:</span> {analysis.stress}/10</div>
                    </div>
                    <div>
                      <span className="font-semibold">Themes:</span> {analysis.themes.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                <div className="mb-2">✨</div>
                <p>Select an entry and click Process<br />to see insights here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

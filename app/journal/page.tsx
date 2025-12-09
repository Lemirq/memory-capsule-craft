"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CraftClient, type CraftBlock, type CraftTextBlock } from "@/lib/craft-api";
import { LLMService, type JournalAnalysis } from "@/lib/llm-service";
import { JournalService } from "@/lib/journal-service";
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
        const llm = new LLMService(settings.openaiKey || ""); // Key might be missing here but checked later
        const journalService = new JournalService(client, llm);
        
        // 1. Find "Journals" document
        const journalsDoc = await journalService.findJournalsDoc();
        
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
      const journalService = new JournalService(client, llm);

      const result = await journalService.processEntry(selectedEntryId, journalsDocId || undefined);
      
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
      const journalService = new JournalService(client, llm);

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
          await journalService.processEntry(entry.id, journalsDocId || undefined);
          
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

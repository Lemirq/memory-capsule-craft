"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CraftClient, type CraftBlock, type CraftTextBlock } from "@/lib/craft-api";
import { getSettings } from "@/lib/storage";
import { InsightsDisplay } from "@/components/insights-display";
import { JournalAnalysis } from "@/lib/llm-service";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function JournalDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [content, setContent] = useState<string>("");
  const [insights, setInsights] = useState<JournalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const fetchEntry = async () => {
      const settings = getSettings();
      if (!settings?.craftToken || !id) return;

      try {
        const client = new CraftClient(settings.craftToken);
        // Fetch block with depth to get content
        const block = await client.getBlock(id, 5);
        
        const title = block.type === "text" || block.type === "page" ? (block as CraftTextBlock).markdown : "Untitled Entry";
        setTitle(title || "Untitled Entry");

        // Separate user content from insights
        // We assume insights are in a block starting with "Memory Capsule Insights"
        // And user content is everything else.
        // Actually, in Craft, the "Page" block has children. 
        // We need to iterate through children.
        
        let userMarkdown = "";
        let insightsData: JournalAnalysis | null = null;
        console.log("Block content:", block.content); 
        if (block.content) {
          for (let i = 0; i < block.content.length; i++) {
            const child = block.content[i];
            
            // Check for insights header (toggle block)
            const isInsightsHeader = child.type === "text" && 
                                   (child as CraftTextBlock).markdown?.includes("Memory Capsule Insights") && 
                                   (child as CraftTextBlock).listStyle === "toggle";

            if (isInsightsHeader) {
              // Check if the JSON block is a child (nested) OR a sibling (flat list)
              
              // Case 1: Nested (original assumption, might happen in some API responses)
              if (child.content && child.content.length > 0) {
                const jsonBlock = child.content[0];
                if (jsonBlock.type === "code" || (jsonBlock.type === "text" && (jsonBlock as CraftTextBlock).markdown?.includes("```json"))) {
                   const contentToParse = (jsonBlock as any).markdown || ("```json\n" + ((jsonBlock as any).rawCode || "") + "\n```");
                   const parsed = parseInsightsFromMarkdown(contentToParse);
                   if (parsed) insightsData = parsed;
                }
              }
              
              // Case 2: Sibling (what the user is seeing)
              // Look at the next block
              if (!insightsData && i + 1 < block.content.length) {
                const nextBlock = block.content[i + 1];
                // Check if it looks like the insights JSON block
                // It should be a code block, or a text block with JSON markdown
                // And usually indented if it was meant to be in the toggle
                if ((nextBlock.type === "code" && (nextBlock as any).language === "json") || 
                    (nextBlock.type === "text" && (nextBlock as CraftTextBlock).markdown?.includes("```json"))) {
                    
                    const contentToParse = (nextBlock as any).markdown || ("```json\n" + ((nextBlock as any).rawCode || "") + "\n```");
                    const parsed = parseInsightsFromMarkdown(contentToParse);
                    if (parsed) {
                      insightsData = parsed;
                      i++; // Skip this block as it's the insights data
                    }
                }
              }
              
              continue; // Skip the header block
            }

            // User content
            // We only add text blocks that are not part of the insights
            if (child.type === "text" && (child as CraftTextBlock).markdown) {
              userMarkdown += (child as CraftTextBlock).markdown + "\n\n";
            }
          }
        }

        setContent(userMarkdown);
        setInsights(insightsData);

      } catch (error) {
        console.error("Failed to fetch entry", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/journals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        {/* Main Content - User Journal */}
        <div className="space-y-6">
          <div className="prose prose-lg prose-stone dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          {content.length === 0 && (
            <p className="text-muted-foreground italic">No content in this entry.</p>
          )}
        </div>

        {/* Sidebar - Insights */}
        <div className="space-y-6">
          {insights ? (
            <div className="sticky top-8">
               <h2 className="text-xl font-semibold mb-4">Insights</h2>
               <InsightsDisplay analysis={insights} />
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50 text-center text-muted-foreground">
              No insights generated for this entry yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper to parse the markdown format we generated back into an object
function parseInsightsFromMarkdown(markdown: string): JournalAnalysis | null {
  try {
    // Look for JSON code block
    const jsonMatch = markdown.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return null;
  } catch (e) {
    console.error("Failed to parse insights JSON", e);
    return null;
  }
}

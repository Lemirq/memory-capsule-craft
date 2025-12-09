import { CraftClient, type CraftBlock, type CraftTextBlock } from "./craft-api";
import { DashboardManager } from "./dashboard-manager";
import { LLMService, type JournalAnalysis } from "./llm-service";

export class JournalService {
  private client: CraftClient;
  private llm: LLMService;

  constructor(client: CraftClient, llm: LLMService) {
    this.client = client;
    this.llm = llm;
  }

  async findJournalsDoc() {
    const docs = await this.client.listDocuments();
    return docs.find(d => d.title === "Journals" && !d.isDeleted);
  }

  async findTodayJournalEntry() {
    const journalsDoc = await this.findJournalsDoc();
    if (!journalsDoc) return null;

    // Fetch children to find today's entry
    // We only need depth 1 to check titles (markdown content of blocks)
    const journalBlock = await this.client.getBlock(journalsDoc.id, 2);
    
    if (!journalBlock.content) return null;

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local time
    
    return journalBlock.content.find(block => {
        if (block.type !== "page" && (block.type !== "text" || (block as CraftTextBlock).textStyle !== "page")) return false;
        const title = (block as CraftTextBlock).markdown;
        return title === today;
    });
  }

  async processEntry(entryId: string, journalsDocId?: string): Promise<JournalAnalysis> {
    // 1. Fetch full entry content
    const entryBlock = await this.client.getBlock(entryId, 5);
    
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
    const result = await this.llm.analyzeEntry(text);

    // 3. Write back to Craft as JSON code block
    const jsonContent = JSON.stringify(result, null, 2);

    // Check if insights block already exists to avoid duplicates (optional but good practice)
    // For now, we'll just append as per original logic, or maybe we should check?
    // The original logic just appended. Let's stick to that for now to minimize risk, 
    // but the PRD says "Check if it contains an Insights JSON toggle".
    // The calling code in app/journal/page.tsx filters out already processed ones.
    // Here we might want to be safe, but let's just append for now.

    await this.client.insertBlocks(entryId, [
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

    // 4. Update Dashboard Index
    try {
        // If journalsDocId is not provided, try to find it
        let rootId = journalsDocId;
        if (!rootId) {
            const doc = await this.findJournalsDoc();
            if (doc) rootId = doc.id;
        }

        if (rootId) {
            const dashboardManager = new DashboardManager(this.client, rootId);
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
            
            // Find entry to get date - we need the date of the entry we just processed
            // We can get it from the entryBlock we fetched earlier
            const dateStr = (entryBlock as CraftTextBlock).markdown || new Date().toISOString().split('T')[0];
            
            if (result.mood) {
                 newDailyMoods.push({ date: dateStr, mood: result.mood });
            }
            
            // Recalculate streak
            const uniqueDates = Array.from(new Set(newDailyMoods.map(m => new Date(m.date).toDateString()))).map(d => new Date(d).getTime()).sort((a, b) => b - a);
            let streak = 0;
            if (uniqueDates.length > 0) {
                streak = 1;
                let currentDate = uniqueDates[0];
                for (let i = 1; i < uniqueDates.length; i++) {
                    const diff = (currentDate - uniqueDates[i]) / (1000 * 60 * 60 * 24);
                    if (diff <= 1.5) { // Allow some slack
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
  }
}

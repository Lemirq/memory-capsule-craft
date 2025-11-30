import { CraftClient, CraftBlock, CraftTextBlock, CraftCodeBlock } from "./craft-api";

export interface DashboardData {
  totalEntries: number;
  avgMood: string;
  streak: number;
  themes: { name: string; count: number }[];
  dailyMoods: { date: string; mood: number }[];
  lastUpdated: string;
}

export class DashboardManager {
  private client: CraftClient;
  private rootId: string;
  private readonly BLOCK_TITLE = "Memory Capsule Dashboard";

  constructor(client: CraftClient, rootId: string) {
    this.client = client;
    this.rootId = rootId;
  }

  async findDashboardBlocks(): Promise<CraftBlock[]> {
    // We need to fetch the root document content to find the block
    // Assuming rootId is the document ID
    const doc = await this.client.getBlock(this.rootId, 1);
    if (!doc.content) {
        console.log("DashboardManager: Root doc has no content");
        return [];
    }

    return doc.content.filter(
      (b) =>
        (b.type === "text" || b.type === "page") &&
        (b as CraftTextBlock).markdown?.includes(this.BLOCK_TITLE) &&
        (b as CraftTextBlock).listStyle === "toggle"
    );
  }

  async ensureDashboardBlock(): Promise<CraftBlock> {
    const existingBlocks = await this.findDashboardBlocks();
    
    // If duplicates, keep the first one and delete others
    if (existingBlocks.length > 1) {
        console.log(`DashboardManager: Found ${existingBlocks.length} dashboard blocks. Cleaning up duplicates...`);
        const toDelete = existingBlocks.slice(1).map(b => b.id!);
        await this.client.deleteBlocks(toDelete);
    }

    const existing = existingBlocks.length > 0 ? existingBlocks[0] : null;

    if (existing) {
        // Check if it has children (valid structure)
        const fullBlock = await this.client.getBlock(existing.id!, 1);
        if (fullBlock.content && fullBlock.content.length > 0) {
            return existing;
        }
        console.log("DashboardManager: Found empty dashboard block, deleting...");
        await this.client.deleteBlocks([existing.id!]);
    }

    // Create new dashboard block (Toggle) with a separator
    const toggleResponse = await this.client.insertBlocks(this.rootId, [
      {
        type: "line"
      },
      {
        type: "text",
        markdown: this.BLOCK_TITLE,
        textStyle: "body",
        listStyle: "toggle",
      }
    ], "end"); // Insert at end

    // The response items will contain the separator and the toggle. 
    // We need the toggle block (second item).
    const toggleBlock = toggleResponse.items[1];
    console.log("DashboardManager: Created toggle block", toggleBlock.id);

    // Insert Code Block as child of Toggle Block
    const initialData: DashboardData = {
      totalEntries: 0,
      avgMood: "0",
      streak: 0,
      themes: [],
      dailyMoods: [],
      lastUpdated: new Date().toISOString(),
    };

    // Use markdown code fence to avoid API validation issues with "code" type
    const jsonString = JSON.stringify(initialData, null, 2);
    await this.client.insertBlocks(toggleBlock.id!, [
      {
        type: "text",
        markdown: "```json\n" + jsonString + "\n```",
      }
    ]);

    console.log("DashboardManager: Created code block as child");
    return toggleBlock;
  }

  async getDashboardData(): Promise<DashboardData | null> {
    const blocks = await this.findDashboardBlocks();
    if (blocks.length === 0) return null;
    const block = blocks[0];

    // Fetch children if not present (though findDashboardBlock might have fetched depth 1)
    // If we need to be sure, we can fetch the block again with depth 1
    const fullBlock = await this.client.getBlock(block.id!, 1);
    
    if (!fullBlock.content || fullBlock.content.length === 0) {
        console.log("DashboardManager: Dashboard block has no children");
        return null;
    }

    const codeBlock = fullBlock.content[0];
    let jsonStr = "";

    if (codeBlock.type === "code") {
      jsonStr = (codeBlock as any).rawCode || (codeBlock as any).code;
    } else if (codeBlock.type === "text" && (codeBlock as CraftTextBlock).markdown?.includes("```json")) {
       const match = (codeBlock as CraftTextBlock).markdown!.match(/```json\n([\s\S]*?)\n```/);
       if (match) jsonStr = match[1];
    }

    if (!jsonStr) {
        console.log("DashboardManager: No JSON content found in child block", codeBlock.type);
        return null;
    }

    try {
      return JSON.parse(jsonStr) as DashboardData;
    } catch (e) {
      console.error("Failed to parse dashboard data", e);
      return null;
    }
  }

  async updateDashboardData(newData: DashboardData): Promise<void> {
    const block = await this.ensureDashboardBlock();
    
    // We need to find the code block ID to update it
    // ensureDashboardBlock returns the toggle block.
    // We need to fetch it to get its children (the code block)
    const fullBlock = await this.client.getBlock(block.id!, 1);
    
    if (!fullBlock.content || fullBlock.content.length === 0) {
        // Should not happen if ensureDashboardBlock works, but if it does, we might need to insert the code block
        // For now, assume it exists or we'd have to handle re-creation
        return;
    }

    const codeBlock = fullBlock.content[0];
    
    const jsonString = JSON.stringify(newData, null, 2);
    await this.client.updateBlock(codeBlock.id!, {
        markdown: "```json\n" + jsonString + "\n```"
    });
  }
}

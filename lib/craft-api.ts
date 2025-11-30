export type CraftBlockType = 
  | "text"
  | "code"
  | "image"
  | "video"
  | "file"
  | "url"
  | "line"
  | "page";

export type CraftTextStyle = 
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "caption"
  | "card"
  | "page";

export type CraftCardLayout = "small" | "medium" | "large";

export type CraftColor = 
  | "text"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export type CraftListStyle = "none" | "bullet" | "numbered" | "todo" | "toggle";

export interface CraftBlockBase {
  id?: string; // Optional for insert, present in response
  type: CraftBlockType;
  color?: CraftColor;
  indentationLevel?: number;
  listStyle?: CraftListStyle;
  hasChildren?: boolean; // Read-only
  content?: CraftBlock[]; // Children
}

export interface CraftTextBlock extends CraftBlockBase {
  type: "text";
  markdown?: string; // For insert/update
  textStyle?: CraftTextStyle;
  font?: "system" | "serif" | "mono"; // Optional font override
  cardLayout?: CraftCardLayout; // Only if textStyle is 'card'
  taskInfo?: {
    state: "todo" | "done" | "canceled";
    scheduleDate?: string;
    deadlineDate?: string;
  };
}

export interface CraftCodeBlock extends CraftBlockBase {
  type: "code";
  rawCode: string;
  language?: string;
}

export interface CraftUrlBlock extends CraftBlockBase {
  type: "url";
  url: string;
  title?: string;
  imageUrl?: string;
}

export interface CraftImageBlock extends CraftBlockBase {
  type: "image";
  image: string; // URL or file path (if supported by API, usually URL for JSON)
}

export type CraftBlock = 
  | CraftTextBlock 
  | CraftCodeBlock 
  | CraftUrlBlock 
  | CraftImageBlock 
  | CraftBlockBase; // Fallback

export interface CraftDocument {
  id: string;
  title: string;
  isDeleted: boolean;
}

export interface CraftBlockInsert {
  type?: CraftBlockType; // Optional, defaults to text if markdown present
  markdown?: string;
  textStyle?: CraftTextStyle;
  listStyle?: CraftListStyle;
  color?: CraftColor;
  // Add other fields as needed for insert
  [key: string]: any; 
}

export class CraftClient {
  private token: string;
  private baseUrl = "https://connect.craft.do/links/DDe776qsEhI/api/v1";

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Craft API Error: ${response.status} ${response.statusText} - ${text}`);
    }

    return response.json();
  }

  async listDocuments(): Promise<CraftDocument[]> {
    const data = await this.request("/documents");
    return data.items;
  }

  async getBlock(blockId: string, maxDepth: number = -1): Promise<CraftBlock> {
    // maxDepth -1 means all descendants
    return this.request(`/blocks?id=${blockId}&maxDepth=${maxDepth}`);
  }

  async insertBlocks(
    targetBlockId: string, 
    blocks: CraftBlockInsert[], 
    position: "start" | "end" | "after" | "before" = "end"
  ): Promise<{ items: CraftBlock[] }> {
    // The API expects a 'position' object which includes the 'pageId' (or target block ID)
    // and the 'position' enum.
    // Based on docs:
    // "position": { "position": "end", "pageId": "doc-123" }
    
    const payload = {
      blocks: blocks,
      position: {
        position: position,
        pageId: targetBlockId // The docs say 'pageId' but it accepts block IDs for nested insertion too usually
      }
    };

    return this.request("/blocks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateBlock(blockId: string, updates: Partial<CraftBlock>): Promise<{ items: CraftBlock[] }> {
    const payload = {
      blocks: [
        {
          id: blockId,
          ...updates
        }
      ]
    };
    return this.request("/blocks", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  }

  async deleteBlocks(blockIds: string[]): Promise<{ items: { id: string }[] }> {
    return this.request("/blocks", {
      method: "DELETE",
      body: JSON.stringify({ blockIds })
    });
  }
}

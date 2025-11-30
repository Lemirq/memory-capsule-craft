import { analyzeJournalEntry, type JournalAnalysis } from "@/app/actions";

export type { JournalAnalysis };

export class LLMService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeEntry(text: string): Promise<JournalAnalysis> {
    try {
      return await analyzeJournalEntry(text, this.apiKey);
    } catch (error) {
      console.error("LLM Analysis Error:", error);
      throw error;
    }
  }
}

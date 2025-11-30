"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const journalAnalysisSchema = z.object({
  summary: z.string().describe("A concise summary of the journal entry."),
  mood: z.number().min(1).max(10).describe("Mood score from 1 to 10."),
  stress: z.number().min(1).max(10).describe("Stress score from 1 to 10."),
  emotion: z.string().describe("The dominant emotion expressed."),
  themes: z.array(z.string()).describe("List of key themes or topics."),
  gratitude: z.string().describe("What the user is grateful for, if mentioned, or a general gratitude sentiment."),
  reflection_questions: z.array(z.string()).describe("3 thought-provoking reflection questions based on the entry."),
  tomorrow_suggestions: z.array(z.string()).describe("3 actionable suggestions for tomorrow."),
  growth_signal: z.boolean().describe("Whether the entry indicates personal growth."),
});

export type JournalAnalysis = z.infer<typeof journalAnalysisSchema>;

export async function analyzeJournalEntry(text: string, apiKey: string) {
  if (!apiKey) {
    throw new Error("OpenAI API Key is required");
  }

  // Configure the OpenAI provider with the user's key
  // Note: In a real production app, we might want to use a server-side env var,
  // but here we are allowing the user to bring their own key via settings.
  // The @ai-sdk/openai provider automatically uses process.env.OPENAI_API_KEY if available,
  // but we can pass headers or configure a custom instance if needed.
  // However, the standard way to use a dynamic key with the SDK is often to instantiate the provider with the key.
  // But @ai-sdk/openai exports a singleton `openai`. 
  // We can use the `createOpenAI` function to create a custom instance.
  
  // Let's import createOpenAI instead of the default instance.
  const { createOpenAI } = await import("@ai-sdk/openai");
  const openaiProvider = createOpenAI({
    apiKey: apiKey,
  });

  const result = await generateObject({
    model: openaiProvider("gpt-4o"),
    schema: journalAnalysisSchema,
    prompt: `Analyze the following journal entry and provide insights:
    
    ${text}
    
    Provide a summary, mood score (1-10), stress score (1-10), dominant emotion, key themes, gratitude found (or inferred), reflection questions, actionable suggestions for tomorrow, and a growth signal boolean.`,
  });
  console.log(result.object);
  return result.object;
}

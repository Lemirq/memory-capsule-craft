import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CraftClient, type CraftBlockInsert } from "@/lib/craft-api";

interface JournalEntry {
  date: string;
  title: string;
  content: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing 'token' query parameter" },
      { status: 400 }
    );
  }

  try {
    // 1. Read journal-dataset.json
    const filePath = path.join(process.cwd(), "journal-dataset.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "journal-dataset.json not found" },
        { status: 404 }
      );
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // 2. Parse JSON
    let entries: JournalEntry[] = [];
    try {
        entries = JSON.parse(fileContent);
    } catch (e) {
        return NextResponse.json(
            { error: "Failed to parse journal-dataset.json" },
            { status: 500 }
        );
    }

    if (!Array.isArray(entries)) {
        return NextResponse.json(
            { error: "Invalid JSON format: expected an array" },
            { status: 500 }
        );
    }

    // 3. Initialize Craft Client
    const client = new CraftClient(token);

    // 4. Find "Journals" document
    const docs = await client.listDocuments();
    let journalsDoc = docs.find(d => d.title === "Journals" && !d.isDeleted);

    if (!journalsDoc) {
      return NextResponse.json(
        { error: "Could not find a document named 'Journals'. Please create one manually first." },
        { status: 404 }
      );
    }

    // 5. Create pages for each entry
    const results = [];
    for (const entry of entries) {
      // Create the parent block for the entry (Date)
      const entryBlock: CraftBlockInsert = {
        type: "text", 
        textStyle: "page",
        markdown: entry.date, 
      };

      const response = await client.insertBlocks(journalsDoc.id, [entryBlock]);
      const createdBlocks = response.items;
      const dateBlockId = createdBlocks[0]?.id;

      if (!dateBlockId) {
        console.error("Failed to create date block for entry", entry.date);
        continue;
      }

      // Insert Title (Bold) and Content
      const contentBlocks: CraftBlockInsert[] = [
          {
              type: "text",
              markdown: `**${entry.title}**`
          },
          ...entry.content.split("\n\n").map(para => ({
            type: "text" as const,
            markdown: para.trim()
          })).filter(b => b.markdown)
      ];

      if (contentBlocks.length > 0) {
        await client.insertBlocks(dateBlockId, contentBlocks);
      }

      results.push({ date: entry.date, id: dateBlockId });
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({ 
      message: "Seed successful", 
      entriesCreated: results.length,
      details: results 
    });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

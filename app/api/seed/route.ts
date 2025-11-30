import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CraftClient, type CraftBlockInsert } from "@/lib/craft-api";

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
    // 1. Read data.json
    const filePath = path.join(process.cwd(), "data.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "data.json not found" },
        { status: 404 }
      );
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const allEntries = JSON.parse(fileContent);

    // 2. Take first 100 entries
    const entries = allEntries.slice(0, 100);

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

    // 5. Prepare blocks for batch insertion
    const blocksToInsert: CraftBlockInsert[] = entries.map((entry: any) => {
      // Create content blocks for the entry text
      const contentBlocks: CraftBlockInsert[] = entry.text.split("\n\n").map((para: string) => ({
        type: "text",
        markdown: para.trim()
      })).filter((b: any) => b.markdown);

      // Create the parent block (page) with children
      return {
        type: "text",
        textStyle: "page",
        markdown: entry.date,
        content: contentBlocks // Nested blocks
      };
    });

    // 6. Insert all blocks in a single call
    const response = await client.insertBlocks(journalsDoc.id, blocksToInsert);

    return NextResponse.json({ 
      message: "Seed successful", 
      entriesProcessed: entries.length,
      blocksCreated: response.items.length
    });

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

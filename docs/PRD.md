# 📘 **MEMORY CAPSULE — PRD v2 (Accurate to Current Architecture)**

## 🧭 1. **Overview**

**Memory Capsule** is a hybrid journaling intelligence system built on top of Craft.
Users write journal entries inside Craft, and Memory Capsule:

1. Fetches today’s entry from Craft
2. Analyzes it using GPT-4o
3. Embeds a **hidden JSON insights block** inside that entry in Craft
4. Updates a **master “Journals” document** which contains global app state:

   * all themes counts
   * streak
   * average mood
   * per-day moods timeline
5. Displays a rich dashboard on your website with:

   * Word cloud
   * Emotional analytics
   * Growth markers
   * Streak
   * Trend lines

**Craft acts as the only datastore.**
**Your website is the analytics, processing, and interaction layer.**

This setup keeps journaling frictionless (write directly in Craft), while allowing advanced insights and beautiful visualizations externally.

---

# 🎯 2. **Goals**

### **Primary Goals**

* Provide seamless journaling: write naturally in Craft
* Enable one-click AI analysis via your website
* Provide daily and longitudinal insights
* Store *all* app data inside Craft (no external database)
* Provide a polished, usable, and emotional dashboard experience
* Make journaling fun, insightful, and sustainable

### **Secondary Goals**

* Maintain user privacy by requiring user-provided API keys
* Keep user flow as simple as possible
* Make error states extremely clear

### **Non-Goals**

* Realtime syncing
* Creating new UI inside Craft
* Decorative block styling in Craft
* Using Craft as a document generator beyond JSON blocks
* External data import from messaging apps or other services

---

# 🧩 3. **Product Pillars**

### **1. Write in Craft**

All journal content originates in Craft pages.
Each entry lives in its own Craft document or section (depending on your folder structure).

### **2. Analyze on Your Website**

The dashboard and “Process Today’s Entry” interactions happen entirely on your website.

### **3. Store Data *inside Craft***

Insights are written back as JSON blocks.
The “Journals” master doc contains global analytics JSON.

### **4. Visualize Everything on the Dashboard**

The website turns Craft JSON into rich UI components.

---

# 🔥 4. **Features (Current + Required)**

This section includes **existing features** and **new features required for competition polish**.

---

# 🧠 4.1 **Core AI Intelligence (Existing, Keep)**

Uses OpenAI GPT-4o to analyze a single journal entry into a typed JSON structure validated with Zod.

Extracted fields:

* `summary`
* `mood` (1–10)
* `stress` (1–10)
* `dominantEmotion`
* `themes[]`
* `gratitude[]`
* `growthSignal: boolean`
* `reflections[]` (reflection questions)
* `suggestions[]` (tomorrow’s actions)

**No change here — this is already excellent.**

---

# 📄 4.2 **Craft Storage Model (Updated)**

Everything is stored inside Craft, using 2 structures:

---

## **A. Per Entry Document (`Daily Journal - YYYY-MM-DD`)**

Each entry will contain:

1. User’s raw text
2. A toggle block titled **“Insights (JSON)”**

   * Inside it, the JSON representation:

```
{
  "summary": "...",
  "mood": 7,
  "stress": 3,
  "dominantEmotion": "...",
  "themes": [...],
  "gratitude": [...],
  "growthSignal": false,
  "reflections": [...],
  "suggestions": [...]
}
```

This JSON block is the only thing the system relies on.
**No decorative blocks. No formatting. Just JSON inside a toggle.**

---

## **B. Master “Journals” Document**

Contains one big JSON block with:

```
{
  "totalEntries": 52,
  "avgMood": 6.8,
  "streak": 52,
  "themes": [...],
  "dailyMoods": [...],
  "lastUpdated": "date"
}
```

This is your system-wide index.
It replaces the need for a traditional SQL database.

You’ve already implemented this — keep it.

---

# 👀 4.3 **Processing Flow (Updated)**

### **When user visits the website:**

The dashboard calls:

* Fetch today’s entry from Craft

* Check if it contains an Insights JSON toggle

* If **Insights exist** →
  Show: **“Today’s entry is already processed.”**
  Disable the process button.

* If **Insights do NOT exist** →
  Show button: **“Process Today’s Entry”**

This logic is required and now included.

---

# ⚙️ 4.4 **Daily Processing (Hybrid Model)**

### Clicking **Process Today’s Entry** on the website:

1. Fetch raw text from Craft entry
2. Run `analyzeJournalEntry()`
3. Validate with Zod
4. Create a JSON insights block
5. Write the JSON block back to the appropriate Craft entry
6. Update the master Journals JSON:

   * increment totalEntries
   * update streak
   * recalculate avgMood
   * update themes counts
   * append daily mood
7. Refresh dashboard visuals

This flow is consistent with your current architecture.

---

# 📊 4.5 Dashboard Features (Already Implemented + Needed Enhancements)

### **Already Implemented**

* Word cloud
* Mood & stress progress bars
* Dominant emotion
* Growth indicators
* Gratitude highlights
* Streak
* Average mood
* Entry list
* Entry detail
* Settings (keys)

### **Enhancements Needed for PRD Completion**

* Mood-over-time line chart (simple, using dailyMoods)
* Themes bubble chart (via aggregated themes)
* Streak timeline (visualizing the streak progression)

These small enhancements dramatically improve perceived polish.

---

# 📅 4.6 **Monthly Summary (Simplified Version)**

Because we store everything in Craft JSON — you can generate:

* aggregated monthly mood
* a monthly themes mini-list
* total days journaled
* average mood
* growth count

A monthly summary can either live:

* on the website only
  OR
* as a JSON block in a “Monthly Insights” section of the “Journals” doc

Ideally for competition:
**Keep it simple. Website-only visualization is enough.**
No need to create special monthly Craft docs.

---

# 🎞️ 4.7 **Yearly “Memory Rewind” (Updated to Fit JSON Model)**

Instead of generating a whole new Craft doc, we can:

* Generate a beautiful page on the dashboard
* Pull:

  * high-level stats
  * mood trends
  * top themes
  * personal growth markers
  * emotional changes
* And optionally

  * write a single yearly JSON inside the master doc

Again, **no decorative Craft docs needed**.

The key deliverable for the competition is the **beautiful dashboard page**.

---

# 🔐 5. **Security & Privacy**

* No data stored outside Craft (except ephemeral LLM input/output)
* User must provide:

  * Craft API key
  * OpenAI key
* Keys stored locally (browser) or encrypted server-side (if you choose)
* No third-party ingestion beyond OpenAI and Craft

---

# 🧪 6. **Testing & Validation**

### Ensure:

* A journal is only processed once per day (button hidden after processing)
* The JSON block is always valid (Zod check)
* The Journals master JSON updates correctly
* No entries are overwritten
* Toggle creation works reliably in Craft
* Dashboard gracefully handles missing/invalid JSON

---

# 📈 7. **KPIs (Realistic Metrics)**

* Daily processing rate
* Weekly retention
* Average mood trend accuracy
* Dashboard visits
* Streak continuation rate

---

# 📅 8. **Roadmap (Adjusted)**

### **Week 1**

* Implement “already processed” condition
* Robust insights toggle creation
* Polish Craft JSON writing logic

### **Week 2**

* Mood-over-time chart
* Themes bubble chart
* Streak timeline

### **Week 3**

* Updated monthly summary view
* Yearly rewind view
* Polish UI

### **Week 4**

* Stress test large JSON datasets
* Responsive optimizations
* Final polish

---

# 🏁 PRD v2 Final Notes

This version of the PRD:

* Removes unnecessary Craft decoration
* Removes Craft indexing doc creation
* Uses Craft as the only datastore
* Keeps JSON-only blocks inside toggles
* Uses dashboard as the single place for visuals
* Adds “already processed today” logic
* Reflects the exact architecture you’re building
* Simplifies monthly/yearly generation
* Focuses on realistic, competition-ready deliverables
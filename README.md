# 📘 **MEMORY CAPSULE — PRD v1.0**

## 🧭 **1. Overview**

**Memory Capsule** is a journaling system powered by Craft + LLM analysis.
Users write their journal entries inside Craft.
The system extracts insights, emotions, summary, themes, and persona growth patterns, storing both raw and enriched entries.

The website acts as a **processing interface** (generate insights, view analytics) and **dashboard viewer** (mood map, themes, yearly recap, etc.).

Craft acts as the **CMS**:

* Raw journal entries
* Enriched, structured summaries
* Monthly and yearly aggregated docs

Our goals:

* Replace paid journaling apps with a seamless Craft-based version
* Provide emotionally resonant analysis and visualizations
* Create “magical moments” like *Monthly Reflections* and *Year Wrapped*
* Make journaling effortless, beautiful, and deeply meaningful

---

# 🎯 **2. Goals & Non-Goals**

## **2.1 Goals**

* Enable daily journaling inside Craft with minimal friction
* Provide high-quality AI-powered insights per entry:

  * Summary
  * Emotional tone
  * Mood & stress score
  * Themes & recurring patterns
  * Gratitude
  * Reflection prompts
  * Recommended actions for tomorrow
* Provide a website dashboard for:

  * Mood map
  * Mood graphs over time
  * Theme clusters
  * Journaling streaks
  * Writing timeline
  * Word frequency
  * Tags (work, relationships, school, health, etc.)
  * Monthly and yearly rollups
* Provide a “one-click processing” UX on the website:

  * Pull today’s Craft entry
  * Process through LLM
  * Write back structured blocks

## **2.2 Non-Goals**

* Real-time syncing of Craft content
* Modifying Craft UI or adding Craft commands
* Automatic notifications/alerts
* Chat/screenshot ingestion (too privacy-sensitive)
* Building a full mobile app (web-first for v1)

---

# 👤 **3. User Personas**

## **3.1 Casual Journaler**

Wants emotional clarity, reflection, mood tracking.
Low friction, minimal setup.

## **3.2 Productivity User / Student**

Uses journaling for goals, mental clarity, planning.

## **3.3 Self-growth + wellness user**

Cares about deeper insights, patterns, therapy-like interpretations.
The most enthusiastic power users.

---

# ✨ **4. Core User Flows**

These flows map to the hybrid architecture.

---

## **4.1 Daily Flow — “Journaling Ritual”**

1. User opens Craft
2. Selects “Daily Journal — Dec 2, 2025” page
3. Writes a raw, unstructured entry
4. Opens **Memory Capsule Web Dashboard**
5. Clicks **Process Today’s Entry**
6. Backend fetches Craft document
7. LLM processes data
8. Backend writes enriched content back to Craft:

   * Summary
   * Mood scoring
   * Reflection prompts
   * Gratitude
   * Themes
9. Dashboard updates analytics instantly
10. User sees graphs today + rolling month

---

## **4.2 Monthly Flow — “Reflection Digest”**

At month’s end, user clicks on the website:
👉 **Generate Monthly Reflection**

Backend:

* Aggregates each day’s themes
* Finds dominant emotions
* Finds best/worst moments
* Creates wordcloud
* Creates “Growth Summary”
* Creates “What changed this month?”
* Creates “Next month guidance”
* Writes a new doc in Craft:
  `Monthly Capsule — November 2025`

Website:

* Shows a summary card
* Adds to the timeline

---

## **4.3 Yearly Flow — “Wrapped”**

User clicks:
👉 **Generate My 2025 Wrapped**

Backend:

* Reads all entries
* Aggregates mood curves
* Detects behavioral changes
* Finds biggest events (emotionally or linguistically significant)
* Generates:

  * “Top 5 Memories”
  * “Most Mentioned People/Places”
  * “Most dominant themes of the year”
  * “How you changed emotionally”
  * “A letter from future you”
* Creates a beautifully structured Craft document
* Adds to dashboard calendar

---

## **4.4 Dashboard Flow — “Self Insight Portal”**

User logs into website anytime → sees dashboard:

* Mood heatmap
* Trends
* Journal streak
* Daily writing count
* Dominant themes
* Growth prompts
* Word frequency
* Timeline view

---

# 🧩 **5. Functional Requirements**

---

## **5.1 Journal Entry Processing**

**Input:** raw text from a Craft document
**Output:** JSON structure

### **LLM must extract:**

* `summary` (3–5 sentence recap)
* `mood` (0–10)
* `stress` (0–10)
* `primary emotion` (“joy”, “sadness”, etc.)
* `themes[]` (ex: school, relationships, productivity)
* `gratitude` (1–3 lines)
* `reflection_questions[]`
* `tomorrow_suggestions[]`
* `growth_signal` (boolean + explanation)

---

## **5.2 Craft Document Updates**

The system must:

* Insert structured blocks at bottom of entry
* Or create a new “Enriched” version of the entry
* Update monthly and yearly summary docs
* Maintain consistent block structure

### **Block Structure Example:**

```
# Summary
<text>

# Mood
<mood score + emoji>

# Stress Level
<number>

# Emotions Detected
- Joy: X
- Anxiety: Y
- Calm: Z

# Themes
- School
- Productivity
- Family

# Gratitude
- I’m grateful for...
- I appreciated...

# Reflection Prompts
- What made today meaningful?

# Suggestions for Tomorrow
- Focus on...
```

---

## **5.3 Dashboard Requirements**

### **Data the dashboard displays:**

* Mood heatmap
* Mood over time (line chart)
* Stress curve
* Total journal days
* Streak
* Word frequency
* Themes bubble chart
* Most common emotions
* Monthly summaries
* Yearly summary highlight reel

### **API Requirements:**

* Fetch entries metadata
* Fetch aggregated insights
* Query entries by:

  * date
  * theme
  * mood
  * stress
* Provide monthly/yearly statistics

---

## **5.4 Frontend UI Requirements**

### **Pages:**

* Login/Onboarding
* Daily Entry Processor
* Dashboard
* Monthly Reflection Page
* Year-in-Review Page
* Account Settings (API keys, Craft connection)

### **Daily Processor UI:**

* Select journal doc (from Craft)
* Button: **Process Entry**
* Show progress spinner
* Optionally show LLM result preview

### **Dashboard UI:**

* Mood map (calendar heatmap)
* Journal streak
* “Your Themes” bubble chart
* Emotion curve
* Reflection of the week
* Embedded link to today’s Craft doc

---

# 🗄️ **6. Data Model**

This lives in your backend DB.

## **Tables:**

### **users**

* id
* email
* craft_user_id
* craft_api_key
* join_date

### **entries**

* id
* user_id
* craft_doc_id
* date
* raw_text
* summary
* mood
* stress
* emotion
* themes (array)
* gratitude
* questions
* suggestions
* growth_signal

### **monthly_summaries**

* user_id
* month
* mood_avg
* stress_avg
* dominant_themes
* notable_moments
* growth_summary

### **yearly_summaries**

* user_id
* year
* top_memories
* theme_evolution
* emotional_change_graph
* wrapped_summary

---

# ⚙️ **7. Technical Architecture**

### **Client (Website)**

* Next.js (likely)
* Auth via Supabase Auth / Clerk / Firebase
* UI with Tailwind + Chakra/Radix
* Calls backend REST endpoints

### **Backend**

* Node.js server
* Endpoints:

  * `/fetch-entry`
  * `/process-entry`
  * `/write-to-craft`
  * `/generate-monthly-summary`
  * `/generate-yearly-summary`

### **LLM**

* GPT-4.1 or o3-mini
* Prompt templates for:

  * Daily summaries
  * Monthly reflections
  * Yearly wrapped narratives

### **Craft Integration**

* Craft API (write, update docs)
* MCP (structured doc transforms)

### **Storage**

* Supabase / Postgres

### **Analytics**

* Computed daily after processing
* Pre-cached for dashboard performance

---

# 🔐 **8. Security & Privacy Considerations**

* Journal text is personal → encryption at rest
* Store only what is needed
* Option for user to delete all entries
* No storing of Craft tokens unencrypted
* LLM must not retain data → include non-retention directive

---

# 🧪 **9. Testing Requirements**

### **Unit tests:**

* LLM extractors
* API integration
* Craft update handlers

### **Integration tests:**

* End-to-end: Craft entry → website → LLM → Craft enriched

### **Validation tests:**

* Proper block formatting
* Missing/empty journal entry handling
* Error fallback for Craft API failures

---

# 📣 **10. Success Metrics**

### **Primary Metrics**

* Daily active processors (DAP)
* Number of enriched entries
* Dashboard visits
* Monthly summary usage

### **Secondary Metrics**

* Streak length
* Re-engagement rate
* User satisfaction survey

---

# 🧭 **11. Roadmap (8-week build)**

### **Week 1**

* Setup project + Craft API integration
* User auth
* DB models

### **Week 2**

* Journal entry fetch
* LLM processing
* Write enriched Craft doc

### **Week 3**

* Daily processor UI
* Dashboard skeleton
* Mood heatmap

### **Week 4**

* Themes + emotional graphs
* Streak tracking
* Entry list

### **Week 5**

* Monthly reflection generator

### **Week 6**

* Year-in-review generator

### **Week 7**

* Polish UI
* Testing + stability
* Add animations

### **Week 8**

* Final presentation
* Demo script
* Optimization
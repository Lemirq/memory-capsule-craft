# Memory Capsule Craft

**Your AI-powered journaling companion that turns daily notes into deep emotional insights.**

![Dashboard Preview](https://placehold.co/1200x600/png?text=Memory+Capsule+Dashboard)
*(Replace with actual screenshot of your dashboard)*

![Craft Insight Block](https://placehold.co/1200x400/png?text=Craft+Insight+Block)
*(Replace with actual screenshot of the JSON toggle in Craft)*

**Built with Next.js, OpenAI, and the Craft API.**

---

### The Story
I love writing in Craft. It's where my thoughts flow most freely. But I found myself envying those dedicated journaling apps that give you mood charts, streak tracking, and "On this day" throwbacks.

I didn't want to leave Craft to get those insights. So I asked myself: **"What if Craft could be the database, and I could build the intelligence layer on top?"**

That's how **Memory Capsule** was born. It keeps your data where it belongs—in your private Craft documents—but adds a layer of AI magic to help you understand your emotional journey.

### How It Works
1.  **Write Naturally**: You write your daily journal entry in Craft, just like you always do.
2.  **One-Click Analysis**: Open the Memory Capsule dashboard and click "Process Today's Entry".
3.  **AI Magic**: The app reads your entry, and uses GPT-4o to analyze your mood, identify themes, and generate reflection questions.
4.  **Full Circle**: The insights are written **back into your Craft document** as a hidden JSON block (so you own the data!), and your Dashboard updates instantly with new stats, streaks, and word clouds.

### Build It Yourself

#### Step 1 – Clone & Configure
Grab the code for the Memory Capsule web app. It's a Next.js application that you can run locally or deploy to Vercel/Netlify.
You'll need two keys:
-   **Craft API Token**: To read/write to your documents.
-   **OpenAI API Key**: To power the intelligence.

#### Step 2 – Create Your "Journals" Doc
Create a new document in Craft called "Journals". This will act as the "Master Database" where the app stores your global stats (streaks, average mood, etc.).

#### Step 3 – Start Journaling
Create a daily note (e.g., "Daily Journal - Dec 9, 2025") and write away!

#### Step 4 – See Your Insights
Launch the app, hit process, and watch your dashboard come alive.
-   **Mood Trends**: See how your week is going at a glance.
-   **Theme Bubbles**: Discover what topics (Work, Family, Anxiety, Joy) are dominating your thoughts.
-   **Memory Rewind**: A "Spotify Wrapped" style view for your year.

### Why It Matters
Journaling is a habit that's hard to keep. By visualizing progress and getting immediate feedback ("Hey, you've been writing a lot about 'Growth' lately!"), Memory Capsule turns a chore into a rewarding ritual. Plus, you never have to worry about export lock-in—it's all just text in your Craft docs.

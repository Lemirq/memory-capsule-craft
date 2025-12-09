# Discord Coach

by Andre Carrera
Fall 2025 · Grand Prize Winner

Your AI accountability partner that meets you where you work – turning your daily goals into real progress.

![discord-coach-1.85ce6ef2.webp](https://www.craft.do/_image/width=3840,quality=85,format=auto/_next/static/media/discord-coach-1.85ce6ef2.png)

![discord-coach-2.fb747fd2.webp](https://www.craft.do/_image/width=3840,quality=85,format=auto/_next/static/media/discord-coach-2.fb747fd2.png)

![icon-craft.77e6bb40.avif](https://www.craft.do/_image/width=3840,quality=85,format=auto/_next/static/media/icon-craft.77e6bb40.png)

![icon-discord.4403a5b5.avif](https://www.craft.do/_image/width=3840,quality=85,format=auto/_next/static/media/icon-discord.4403a5b5.png)

Built by Andre Carrera with Craft and Discord

As the creator says:
“I want to have an accountability partner/coach that follows up with me based on a set program and I am much better at responding to messages from discord than I am at marking off todos.”

### Build It Yourself

#### Step 1 – Create Your Craft Document

Start by setting up a Craft document where you’ll store your daily notes and tasks. This is where the Discord Coach will track your progress and pull context from your work.

#### Step 2 – Set Up Your Discord Bot

Create a new Discord bot through the Discord Developer Portal. You’ll need:

- A Discord server where you want the bot to operate
- Your bot token (keep this secure!)
- Basic permissions for messaging and reading messages

#### Step 3 – Connect Your Craft API

Generate a Craft API key for your daily notes document. The Discord Coach uses this to:

- Read your daily notes and tasks
- Understand your goals and progress
- Update your tasks as you complete them

#### Step 4 – Deploy the Backend

Set up a simple backend server (the example uses Fly.dev) that runs the Discord Coach bot. This server:

- Listens for messages from your Discord server
- Connects to Claude or ChatGPT for intelligent coaching
- Reads and writes to your Craft document via the API
- Sends you proactive check-ins each morning

#### The Result

To see how it works for the user who already built it, you can visit his bot's [authentication page](https://craft-imagine-coach.fly.dev/), sign in with you Discord Account, and add your Daily Note Craft API URL and key.

To activate it, you need to either [join the test server](https://discord.com/invite/3Br8bJKF) with the bot or install it to your own server with [this link.](https://discord.com/oauth2/authorize?client_id=1438961484980949042&permissions=68608&scope=bot)

After this set-up, each morning, Andre's Discord Coach is going to send you a message. Respond naturally – just like texting a friend. The bot will will:

- Understands your context from previous days
- Asks about your progress
- Updates your Craft tasks automatically
- Provides accountability and encouragement
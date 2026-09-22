import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Reborn Kingdom",
  },
});

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const characters = {
  elara: {
    name: "Princess Elara",
    personality:
      "Kind, curious, brave and intelligent. She is protective of the player and fascinated by their mysterious origins."
  },
  knight: {
    name: "Sir Kael",
    personality:
      "Serious, loyal and cautious. He distrusts strangers but respects courage and honesty."
  },
  mage: {
    name: "Liora",
    personality:
      "A clever young mage who loves discovering ancient magic. She is playful but extremely knowledgeable."
  },
  goblin: {
    name: "Grim",
    personality:
      "A mischievous goblin who talks quickly, loves shiny objects and sometimes accidentally reveals useful information."
  }
};

app.post("/api/chat", async (req, res) => {
  try {
    const { message, character = "elara", history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    const selected = characters[character] || characters.elara;

    const systemPrompt = `
You are the AI narrator and game master of an interactive fantasy adventure.

WORLD:
The player has been mysteriously reborn into a medieval fantasy world called Eldoria.

The world contains:
- Humans
- Knights
- Princesses and kings
- Goblins
- Elves
- Mages
- Monsters
- Ancient ruins
- Magic
- Dangerous forests
- Multiple kingdoms

STORY:
The player recently woke up in a mysterious forest with no idea how they arrived.

Princess Elara discovered the player while traveling with royal knights.
She brought the player back toward the kingdom because she believes the player
may be connected to an ancient mystery.

CURRENT CHARACTER:
${selected.name}

CHARACTER PERSONALITY:
${selected.personality}

RULES:
- The player controls their own character.
- NEVER decide the player's actions for them.
- NEVER write dialogue for the player.
- You control NPCs, creatures and the environment.
- Keep characters consistent.
- Remember important events from the conversation.
- Make the world feel alive.
- Allow multiple possible choices instead of forcing one path.
- Keep responses reasonably short so the conversation feels natural.
- Use dialogue and descriptions.
- Characters can disagree with each other.
- The player can make unexpected choices.
- Do not constantly give the player a list of choices unless it naturally fits.
- Treat the adventure like an interactive fantasy game.

IMPORTANT:
The player is the main character.
Do not end every response with "What do you do?"
Instead, naturally leave room for the player to respond.

Respond as the selected character and/or narrator when appropriate.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-20).map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content
      })),
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "google/gemma-4-31b-it:free",
      messages,
      temperature: 0.85,
      max_tokens: 800
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "The world falls strangely silent...";

    res.json({
      reply,
      character: selected.name
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "The kingdom's magic failed to respond. Check your API configuration."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Reborn Kingdom running on port ${PORT}`);
});

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Initialize Gemini if key is present
  const key = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (key && key !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({ apiKey: key });
  } else {
    console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to offline/placeholder generation.");
  }

  // 1. Generate Lesson Endpoint
  app.post("/api/generate-lesson", async (req, res) => {
    try {
      const { subject, gradeLevel, topic } = req.body;
      if (!subject || !gradeLevel || !topic) {
        return res.status(400).json({ error: "Missing required fields: subject, gradeLevel, topic" });
      }

      if (!ai) {
        console.log("No Gemini API client initialized. Returning standard high-quality boilerplate lesson.");
        return res.json(getBoilerplateLesson(subject, gradeLevel, topic));
      }

      const prompt = `Generate a comprehensive, fun, and child-appropriate homeschooling lesson about the topic "${topic}" for a student in ${gradeLevel} learning ${subject}.
      
      You must:
      1. Write a captivating, grade-appropriate lesson title.
      2. Write a 1-2 sentence high-level summary.
      3. Write the detailed lesson content. It should be written in an encouraging, exciting tone tailored specifically to a child in ${gradeLevel}. Use Markdown headers, bullet points, and bold text for important vocabularies. Keep it around 400-600 words of educational reading, packed with analogies.
      4. Select the most appropriate interactive game type:
         - "matching_cards": great for vocabulary-to-definitions, math problems-to-answers, or concepts-to-examples. Keep it to 4 to 6 matching cards.
         - "word_unscramble": great for spelling and term practice. Give 4 to 6 essential vocabulary terms to unscramble, along with clear clues.
         - "narrative_quest": great for history, exploration, scenarios, or science-based process decision quests. Create a setting introduction and 3 chronological steps. Each step must have a narrative situation and 3 choices where only ONE choice is the highly scientific/logical/historically accurate choice, with rich encouraging feedback for incorrect choices.
      5. Draft a 3-question Multiple Choice Quiz testing comprehension. Each question needs exactly 4 options, a correctIndex (0-3), and a highly educational child-friendly explanation.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A catchy and fun title for the lesson" },
              summary: { type: Type.STRING, description: "A clean 1-2 sentence overview of the lesson" },
              content: { type: Type.STRING, description: "The full lesson text in fun, grade-appropriate Markdown" },
              gameType: { type: Type.STRING, enum: ["narrative_quest", "matching_cards", "word_unscramble"], description: "The best interactive learning game suited for the lesson topic" },
              gameData: {
                type: Type.OBJECT,
                properties: {
                  narrativeQuest: {
                    type: Type.OBJECT,
                    properties: {
                      introduction: { type: Type.STRING, description: "Intro setting of the adventure quest" },
                      steps: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING, description: "A paragraph of narrative setting the stage and posing a choice context." },
                            choices: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  text: { type: Type.STRING, description: "Choice text option" },
                                  isCorrect: { type: Type.BOOLEAN, description: "Whether this is the correct choice" },
                                  feedback: { type: Type.STRING, description: "Encouraging feedback stating why this choice works or doesn't work" }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  },
                  matchingCards: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING, description: "Unique string code e.g. pair-1" },
                        left: { type: Type.STRING, description: "Left side node (term, clue, or problem)" },
                        right: { type: Type.STRING, description: "Right side node (definition, match, or result)" }
                      }
                    }
                  },
                  wordUnscramble: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING, description: "The secret uppercase word (only letters, no spaces/hyphens, e.g., PHOTOSYNTHESIS, SOLSYSTEM, ATOM, FRACTION)" },
                        hint: { type: Type.STRING, description: "A descriptive hint clue for finding the word" }
                      }
                    }
                  }
                }
              },
              quiz: {
                type: Type.ARRAY,
                description: "Array of exactly 3 comprehensive educational multiple choice questions",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The quiz question" },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of exactly 4 choices"
                    },
                    correctIndex: { type: Type.INTEGER, description: "The 0-based index of the correct option (0 to 3)" },
                    explanation: { type: Type.STRING, description: "Encouraging, helpful child-level explanation of the answer" }
                  },
                  required: ["question", "options", "correctIndex", "explanation"]
                }
              }
            },
            required: ["title", "summary", "content", "gameType", "gameData", "quiz"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from AI");
      }

      const lessonData = JSON.parse(text);
      res.json(lessonData);
    } catch (error: any) {
      console.error("AI Lesson Generation error:", error);
      res.status(500).json({
        error: "Failed to generate lesson with AI.",
        details: error?.message || ""
      });
    }
  });

  // 2. Chat Tutor Endpoint
  app.post("/api/ask-tutor", async (req, res) => {
    try {
      const { lessonTitle, subject, gradeLevel, question, childName, chatHistory } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Missing required query question" });
      }

      if (!ai) {
        return res.json({
          reply: `Hi ${childName || "there"}! I'm Sparky, your homeschool tutor. Currently, I'm offline, but remember: asking questions is the superpower of learning! Keep working on **${lessonTitle || "your lessons"}**!`
        });
      }

      // Format previous chats for context
      const formattedHistory = (chatHistory || [])
        .map((m: any) => `${m.role === "user" ? "Student" : "Sparky"}: ${m.text}`)
        .join("\n");

      const systemPrompt = `You are "Sparky", an enthusiastic, friendly, and super encouraging AI Homeschool Tutor.
Your student is named ${childName || "Friend"}, is in ${gradeLevel || "Grade School"}, and is studying "${subject || "Science"}" (specifically working on the lesson: "${lessonTitle || "General Knowledge"}").

Guidelines:
1. Speak directly, warmly, and enthusiastically to the child.
2. Keep explanation lengths appropriate for ${gradeLevel || "their grade level"}.
3. Use simple analogies, imaginary objects, and step-by-step guidance.
4. **NEVER** just give the direct answer away! Instead, explain the background concept and prompt them with a playful, leading, grade-appropriate question to help them reach the answer on their own.
5. Use emojis to make it friendly and interactive.
6. Keep replies concise (usually under 150 words).

Previous conversation history:
${formattedHistory}

Student's new question:
"${question}"`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [systemPrompt],
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Tutor request error:", error);
      res.status(500).json({
        reply: "Oops! My thinking gears are a bit stuck at the moment. 🛠️ Could you try asking me that once again, my young friend?"
      });
    }
  });

  // Vite development vs production serving environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

// Offline fallback generator for reliability when Gemini is not configured
function getBoilerplateLesson(subject: string, gradeLevel: string, topic: string) {
  const normalizedTopic = topic.toLowerCase();
  
  if (normalizedTopic.includes("space") || normalizedTopic.includes("planet") || normalizedTopic.includes("solar")) {
    return {
      title: "🚀 Journey to the Stars: Our Solar System!",
      summary: "Explore the magical neighborhood of Earth, the sun, and the alignment of planets in gravity.",
      content: `# Our Solar System Adventure!\n\nWelcome to your cosmic journey, space explorer! Today, we are going to travel through space to check out the **Solar System**. Our Solar System is made of the Sun plus everything that travels around it.\n\n## 1. The Mighty Sun ☀️\nAt the absolute center of our system is the **Sun**. The Sun is actually a colossal, super-hot star! It is so massive that the gravity it generates holds all eight of our planets in their paths, which we call **orbits**.\n\n## 2. Inner Rocky Planets 🪨\nClosest to the Sun, we have four rocky planets:\n* **Mercury**: The smallest, speediest planet that gets super hot and icy cold.\n* **Venus**: Covered in thick, yellow clouds and hot enough to melt lead!\n* **Earth**: Our home! The perfect place with clean liquid water and safe air.\n* **Mars**: The red planet covered in rusty iron dust, with giant volcanoes.\n\n## 3. Outer Giant Gas Planets ☁️\nFurther out, beyond Mars, we have the gigantic gaseous planets:\n* **Jupiter**: The absolute biggest planet, featuring a giant swirling storm called the Red Spot!\n* **Saturn**: Known for its majestic glowing rings made of ice and rock dust.\n* **Uranus**: A beautiful icy-blue gas giant that spins sideways!\n* **Neptune**: The furthest, blue planet with the fastest, wildest winds.\n\nKeep traveling and ask Sparky if you want to know about other solar bodies!`,
      gameType: "matching_cards",
      gameData: {
        matchingCards: [
          { id: "p1", left: "Mars", right: "The Red Planet" },
          { id: "p2", left: "Saturn", right: "Planet with giant beautiful rings" },
          { id: "p3", left: "Sun", right: "The giant star at the center" },
          { id: "p4", left: "Jupiter", right: "The absolute largest gas giant" },
          { id: "p5", left: "Orbit", right: "The path a planet takes around the Sun" }
        ]
      },
      quiz: [
        {
          question: "Which planet is known as the 'Red Planet' due to its rusty dust?",
          options: ["Earth", "Venus", "Mars", "Neptune"],
          correctIndex: 2,
          explanation: "Mars is covered in iron oxide, which is essentially rust, giving it a bright reddish appearance in our sky!"
        },
        {
          question: "What is the name of the paths planets take as they circle the Sun?",
          options: ["Tracks", "Orbits", "Highways", "Sectors"],
          correctIndex: 1,
          explanation: "An orbit is a regular, repeating pathway that an object in space takes around another due to gravitational pull."
        },
        {
          question: "Which of these is NOT a solid rocky planet?",
          options: ["Mercury", "Earth", "Saturn", "Mars"],
          correctIndex: 2,
          explanation: "Saturn is a gas giant, meaning it is made mainly of gases like hydrogen and helium instead of hard crusty rock!"
        }
      ]
    };
  }

  // Generic fallback if not space
  return {
    title: `🌟 Exploring ${topic}!`,
    summary: `Let's dive into learning all about ${topic} for ${gradeLevel}!`,
    content: `# All About ${topic}!\n\nToday, we are exploring **${topic}**. This is an exciting part of our ${subject} homeschooling track!\n\n## Let's Discover!\nLearning about this topic opens our eyes to how the world operates. When we ask questions about how things fit together, we are behaving like true scientists and historians.\n\n## Key Concepts:\n1. **Curiosity**: Asking 'why' is the single most important first step to learning anything.\n2. **Practice**: Playing games, writing down definitions, and taking quizzes makes our brain muscles grow stronger.\n3. **Investigation**: Sharing what you find makes learning double the fun!\n\nKeep studying this topic and be sure to trigger games below!`,
    gameType: "word_unscramble",
    gameData: {
      wordUnscramble: [
        { word: "CURIOSITY", hint: "The desire to learn and investigate custom things" },
        { word: "PRACTICE", hint: "Doing something over and over to get amazing at it" },
        { word: "HOMESCHOOL", hint: "Learning with fun modules at home with family" },
        { word: "SCIENCE", hint: "The exciting study of the natural world and stars" }
      ]
    },
    quiz: [
      {
        question: `What is the most important active step in studying ${topic}?`,
        options: ["Sleeping", "Hypothesizing and asking 'why'", "Staying silent", "Giving up early"],
        correctIndex: 1,
        explanation: "Curiosity and asking 'why' is what creates amazing discoveries in our educational world!"
      },
      {
        question: "How do our brains grow stronger when studying?",
        options: ["By practicing and testing our knowledge", "By skipping quizzes", "By closing notebooks", "By forgetting everything"],
        correctIndex: 0,
        explanation: "Just like lifting weights builds arm muscles, practicing, game-playing, and quizzing builds brain pathways!"
      },
      {
        question: `In what topic is this homeschooling lesson categorized?`,
        options: ["Not categorized", `The study of ${subject}`, "Sleeping science", "Aviation"],
        correctIndex: 1,
        explanation: `This lesson is categorized perfectly inside your ${subject} curriculum!`
      }
    ]
  };
}

startServer().catch((err) => {
  console.error("Critical server bootstrap error:", err);
});

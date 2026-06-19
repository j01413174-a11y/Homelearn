import { Lesson } from "../types";

export const defaultLessons: Lesson[] = [
  {
    id: "space-solar-system",
    title: "🚀 Journey to the Stars: Our Solar System!",
    subject: "Science",
    gradeLevel: "Grade 3",
    topic: "Solar System",
    summary: "Explore the awesome neighborhood of Earth, the fiery Sun, and the gas giants in space.",
    content: `# Welcome to Your Space Adventure!\n\nToday, we are launching our rockets and venturing into the deep cosmic sea to study our **Solar System**! 🌍🚀\n\nOur Solar System is a spectacular family of planets, moons, asteroids, and space dust that all circle around one giant, glowing parent star: **The Sun**.\n\n## 1. The Super-Hot Sun ☀️\nAt the very center of our solar neighborhood is gravity's king, the **Sun**. The Sun is so massive that more than one million Earths could fit inside it! Because of its colossal mass, it creates a powerful pull called **gravity** that holds all eight planets in their repeating pathways, which we call **orbits**.\n\n## 2. The Rocky Planets (The Inner Circle) 🪨\nClosest to the Sun, we find four solid planets that you could walk on (if they weren't so extreme!):\n* **Mercury**: A speedy little planet that gets scorched hot in the daytime and freezes into ice at night.\n* **Venus**: Our 'sister planet,' but blanketed with dense, yellow acid clouds that trap heat like an oven.\n* **Earth**: Our home! It's the only known cosmic oasis with oceans of liquid water and fresh oxygen to breathe.\n* **Mars**: The rusty Red Planet, home to a massive volcano three times taller than Mount Everest!\n\n## 3. The Gas Giants (The Outer Circle) ☁️\nPast the rocky planet zone lies a ring of asteroid rocks, followed by four massive planets made mostly of gas and liquid ice:\n* **Jupiter**: The giant king of planets, featuring the *Great Red Spot*—a swirling hurricane storm twice as wide as Earth!\n* **Saturn**: Famous for its stunning, wide glowing rings made of ice shards and cosmic rock dust.\n* **Uranus**: A frozen, pale blue planet that rotates with a funny sideways tilt!\n* **Neptune**: A deep blue, windy world where cold storm winds travel faster than fighter jets.\n\nAsk Sparky, your tutor, any question you have!`,
    createdSeconds: 1781872100,
    gameType: "matching_cards",
    gameData: {
      matchingCards: [
        { id: "space-1", left: "Mars", right: "The rusty Red Planet with a huge volcano" },
        { id: "space-2", left: "Saturn", right: "Famous for its stunning rings of ice and rock" },
        { id: "space-3", left: "Sun", right: "The gigantic hot star holding our orbits together" },
        { id: "space-4", left: "Orbit", right: "The repetitive gravitational path a planet walks" },
        { id: "space-5", left: "Jupiter", right: "The king of gas giants with the Great Red Spot storm" }
      ]
    },
    quiz: [
      {
        question: "Which solar character holds all 8 planets in orbit using its gravitational pull?",
        options: ["Jupiter", "The Moon", "The Sun", "The Milky Way"],
        correctIndex: 2,
        explanation: "The Sun has a massive gravitational pull because it makes up 99.8% of all matter in our Solar System!"
      },
      {
        question: "Why is Mars called the 'Red Planet'?",
        options: [
          "It is covered in glowing red lava flows",
          "It has rusty iron dust covering its outer crust",
          "It is extremely warm and constantly cooking",
          "It's covered in strawberry orchards"
        ],
        correctIndex: 1,
        explanation: "The surface of Mars is coated in iron oxide, which is essentially the same chemical as metal rust!"
      },
      {
        question: "Which extreme gas giant rotates with a sideways tilt?",
        options: ["Uranus", "Jupiter", "Neptune", "Mercury"],
        correctIndex: 0,
        explanation: "Uranus travels around the sun rolling practically on its side, unlike all other planets!"
      }
    ]
  },
  {
    id: "fractions-pizza",
    title: "🍕 Fraction Secrets: Sharing the Hero Pizza!",
    subject: "Math",
    gradeLevel: "Grade 2",
    topic: "Fractions",
    summary: "Master the secret math of numerators and denominators to split and share foods perfectly.",
    content: `# Split the Pizza! 🍕\n\nImagine you just cooked a beautiful, steaming-hot pepperoni pizza. You invite three of your best friends over to share it. How do we make sure everybody gets an exactly equal, fair slice?\n\nThat is where the math magic of **Fractions** comes to the rescue! 🧙‍♂️✨\n\n## 1. What is a Fraction?\nA fraction is simply a small way of writing **equal parts of a whole thing**. Instead of having whole numbers like 1, 2, or 3, we use fractions to show slices of 1.\n\nFractions always look like two numbers stacked on top of each other, split by a horizontal line (for example, **1/2** or **3/4**).\n\n## 2. Meet the Denominator (The Bottom Number) 👥\nThe number on the bottom is called the **Denominator**.\n* Think of it as **D for Down** (since it sits downstairs) and **D for Division**.\n* It tells you the **total number of equal slices** the whole item was chopped into.\n* For example, in the fraction **1/4**, the denominator is **4**. That means we chopped our pizza into 4 perfect, equal pieces.\n\n## 3. Meet the Numerator (The Top Number) 🍕\nThe number on top is called the **Numerator**.\n* It tells you **how many of those slices you are holding** or talking about.\n* Think of the numerator as 'Number of slices on my plate!'\n* In the fraction **3/4**, the numerator is **3**. That means you have taken 3 out of the 4 slices, leaving just one slice in the box!\n\n## 4. Crucial Fractions to Memorize\n* **1/2 (One-Half)**: Splitting something into exactly two identical pieces.\n* **1/3 (One-Third)**: Splitting something into three identical pieces.\n* **1/4 (One-Quarter / Fourth)**: Splitting something into four identical pieces. Great for sharing with three friends!\n\nNow, test your math powers by solving matching questions or taking the quiz below!`,
    createdSeconds: 1781872200,
    gameType: "word_unscramble",
    gameData: {
      wordUnscramble: [
        { word: "DENOMINATOR", hint: "The bottom number of a fraction that shows total equal slices" },
        { word: "NUMERATOR", hint: "The top number of a fraction showing how many slices we have" },
        { word: "FRACTION", hint: "A custom math piece representing equal parts of a whole thing" },
        { word: "EQUALS", hint: "Meaning all shared slices must be exactly the exact size" }
      ]
    },
    quiz: [
      {
        question: "In a fraction, which number tells us the TOTAL number of slices we chopped the item into?",
        options: ["The Numerator", "The Denominator", "The Multiplier", "The Decibel"],
        correctIndex: 1,
        explanation: "The Denominator (D for Down) shows the total divisions of the whole item."
      },
      {
        question: "If you take 3 slices of a pizza that was cut into 8 equal pieces, how do we write this fraction?",
        options: ["8 / 3", "3 / 8", "1 / 3", "3 / 11"],
        correctIndex: 1,
        explanation: "You have 3 slices (Numerator is 3) out of a total of 8 slices (Denominator is 8), which is written 3/8."
      },
      {
        question: "What must be true about the slices in order for them to count as fractions?",
        options: [
          "They must be shaped like triangles",
          "They must be covered in cheese",
          "All slices must be exactly equal in size",
          "The pizza must be eaten hot"
        ],
        correctIndex: 2,
        explanation: "Fractions represent equal pieces of a whole, so all sliced pieces must be exactly identical in size!"
      }
    ]
  }
];

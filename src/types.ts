export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  grade: string;
  avatar: string;
  totalStars: number;
  unlockedBadges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  earnedAt: string;
}

export interface GameQuestStep {
  text: string;
  choices: {
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface GameMatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface GameWordUnscramble {
  word: string;
  hint: string;
}

export interface GameData {
  narrativeQuest?: {
    introduction: string;
    steps: GameQuestStep[];
  };
  matchingCards?: GameMatchingPair[];
  wordUnscramble?: GameWordUnscramble[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  summary: string;
  content: string; // Markdown formatted
  createdSeconds: number;
  gameType: "narrative_quest" | "matching_cards" | "word_unscramble";
  gameData: GameData;
  quiz: QuizQuestion[];
}

export interface ProgressRecord {
  id: string;
  profileId: string;
  lessonId: string;
  lessonTitle: string;
  subject: string;
  completedAt: string;
  quizScore: number; // e.g. 3 out of 3 (100)
  totalQuestions: number;
  starsEarned: number;
  feedback?: string;
  gamePlayed: boolean;
}

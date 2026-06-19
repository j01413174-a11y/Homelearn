import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db, auth } from "./firebase";
import { ChildProfile, Lesson, ProgressRecord } from "./types";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import { defaultLessons } from "./data/defaultLessons";
import ParentDashboard from "./components/ParentDashboard";
import InteractiveGame from "./components/InteractiveGame";
import AITutorChat from "./components/AITutorChat";
import ReactMarkdown from "react-markdown";
import { getStandardForLesson } from "./utils/standards";
import {
  GraduationCap,
  Sparkles,
  Star,
  Users,
  Trophy,
  Activity,
  ArrowLeft,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  XCircle,
  Award,
  Printer,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut
} from "lucide-react";

export default function App() {
  // Navigation Routing States
  // "portal" | "parent" | "child_select" | "child_dashboard" | "study_desk"
  const [currentView, setCurrentView] = useState<"portal" | "parent" | "child_select" | "child_dashboard" | "study_desk">("portal");

  // Database lists
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [progressList, setProgressList] = useState<ProgressRecord[]>([]);

  // Selected contexts
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Active Desk Tabs: "lesson" | "game" | "tutor" | "quiz"
  const [studyTab, setStudyTab] = useState<"lesson" | "game" | "tutor" | "quiz">("lesson");

  // Local Lesson generator feedback
  const [loadingDb, setLoadingDb] = useState(true);

  // Active Quiz State
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizShowFeedback, setQuizShowFeedback] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Section 508 / IDEA Accessibility Sizing & Audio narration
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg" | "xl">("md");
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Terminate any reading audios when shifting lessons or dashboards
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentView, activeLesson, studyTab]);

  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!activeLesson) return;
      window.speechSynthesis.cancel();
      // Clean content headers and stars for clear speech output
      const cleanContent = activeLesson.content
        .replace(/[#*`_\[\]()\-]/g, " ")
        .replace(/\s+/g, " ");
      const speechString = `Reading active Lesson: ${activeLesson.title}. Subject: ${activeLesson.subject}. Grade level: ${activeLesson.gradeLevel}. Content: ${cleanContent}`;
      const utterance = new SpeechSynthesisUtterance(speechString);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // 1. Synchronize lessons, profiles, and logs on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingDb(true);

        // A. Load Lessons
        let fetchedLessons: Lesson[] = [];
        let lessonSnap;
        try {
          lessonSnap = await getDocs(collection(db, "lessons"));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "lessons");
          throw err;
        }

        if (lessonSnap.empty) {
          console.log("Firestore empty. Seeding default lessons into cloud...");
          // Seed Firestore
          for (const item of defaultLessons) {
            const raw = { ...item };
            const { id, ...lessonWithoutId } = raw;
            let docRef;
            try {
              docRef = await addDoc(collection(db, "lessons"), lessonWithoutId);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, "lessons");
              throw err;
            }
            fetchedLessons.push({ ...lessonWithoutId, id: docRef.id });
          }
        } else {
          lessonSnap.forEach((d) => {
            fetchedLessons.push({ id: d.id, ...d.data() } as Lesson);
          });
        }
        setLessons(fetchedLessons);

        // B. Load Profiles
        let fetchedProfiles: ChildProfile[] = [];
        let profileSnap;
        try {
          profileSnap = await getDocs(collection(db, "profiles"));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "profiles");
          throw err;
        }

        profileSnap.forEach((d) => {
          fetchedProfiles.push({ id: d.id, ...d.data() } as ChildProfile);
        });
        setProfiles(fetchedProfiles);

        // C. Load Progress
        let fetchedProgress: ProgressRecord[] = [];
        let progressSnap;
        try {
          progressSnap = await getDocs(collection(db, "progress"));
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, "progress");
          throw err;
        }

        progressSnap.forEach((d) => {
          fetchedProgress.push({ id: d.id, ...d.data() } as ProgressRecord);
        });
        setProgressList(fetchedProgress);

      } catch (err) {
        console.error("Firestore sync warning. Running in responsive client mode.", err);
        // Fallback to defaults
        setLessons(defaultLessons);
      } finally {
        setLoadingDb(false);
      }
    }
    loadData();
  }, []);

  // 2. Stars & Badges Rewarding Engine
  const rewardStars = async (profileId: string, amount: number) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    const newStars = (profile.totalStars || 0) + amount;
    const updatedProfiles = profiles.map((p) => {
      if (p.id === profileId) {
        return { ...p, totalStars: newStars };
      }
      return p;
    });

    setProfiles(updatedProfiles);
    if (activeProfile?.id === profileId) {
      setActiveProfile({ ...activeProfile, totalStars: newStars });
    }

    // Persist star update to Firestore
    try {
      await updateDoc(doc(db, "profiles", profileId), { totalStars: newStars });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `profiles/${profileId}`);
    }
  };

  const handleGameCompletion = (stars: number) => {
    if (activeProfile) {
      rewardStars(activeProfile.id, stars);
    }
  };

  // 3. Quiz flow controllers
  const handleQuizAnswerSelect = (optionIndex: number) => {
    if (quizShowFeedback) return;
    setQuizSelectedOption(optionIndex);
    setQuizShowFeedback(true);

    const questionObj = activeLesson?.quiz[quizQuestionIndex];
    if (questionObj && optionIndex === questionObj.correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = async () => {
    setQuizSelectedOption(null);
    setQuizShowFeedback(false);

    const nextIndex = quizQuestionIndex + 1;
    if (activeLesson && nextIndex < activeLesson.quiz.length) {
      setQuizQuestionIndex(nextIndex);
    } else {
      // Quiz complete!
      setQuizCompleted(true);
      const totalStars = quizScore * 2 + 5; // e.g. 5 base completion + 2 stars per correct answer!

      if (activeProfile && activeLesson) {
        // Complete Stars Addition
        await rewardStars(activeProfile.id, totalStars);

        // Push new progress completion record
        try {
          const record: Omit<ProgressRecord, "id"> = {
            profileId: activeProfile.id,
            lessonId: activeLesson.id,
            lessonTitle: activeLesson.title,
            subject: activeLesson.subject,
            completedAt: new Date().toISOString(),
            quizScore: quizScore,
            totalQuestions: activeLesson.quiz.length,
            starsEarned: totalStars,
            gamePlayed: true
          };

          let docRef;
          try {
            docRef = await addDoc(collection(db, "progress"), record);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, "progress");
            throw err;
          }
          setProgressList((prev) => [{ id: docRef.id, ...record }, ...prev]);
        } catch (err) {
          console.error("Progress save failed:", err);
        }
      }
    }
  };

  const resetQuiz = () => {
    setQuizQuestionIndex(0);
    setQuizSelectedOption(null);
    setQuizShowFeedback(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  // Return to dashboards
  const enterLessonDesk = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setStudyTab("lesson");
    resetQuiz();
    setCurrentView("study_desk");
  };

  return (
    <div id="homeschool_root" className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans leading-relaxed selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* GLOBAL NAVBAR HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 py-4 px-6 md:px-12 sticky top-0 z-50 shadow-sm/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setCurrentView("portal")}
            className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-all duration-205"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-[14px] flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-150">
              🎓
            </div>
            <div>
              <h1 className="font-display font-black text-lg text-slate-900 tracking-tight leading-none">Homeschool learning hub</h1>
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest leading-none mt-1 block">AI Smart Curriculum</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentView !== "portal" && (
              <button
                onClick={() => setCurrentView("portal")}
                className="inline-flex items-center space-x-1.5 border border-slate-205 hover:border-indigo-600 hover:bg-indigo-50/30 hover:text-indigo-600 text-slate-650 font-bold px-4 py-2 rounded-xl transition duration-150 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Choose Gateway</span>
              </button>
            )}

            {currentView === "parent" && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-emerald-700 bg-emerald-55/70 font-extrabold text-[11px] border border-emerald-100/60 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SUPERVISION ACTIVE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Diffs core loader */}
      {loadingDb ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 font-display">Unlocking custom knowledge lockers...</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

          {/* ===================== VIEW 1: HUB SPLASH PORTAL ===================== */}
          {currentView === "portal" && (
            <div className="max-w-5xl mx-auto py-10 md:py-14 space-y-12 animate-fade-in">
              
              {/* Header Title Accent */}
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <div className="inline-flex items-center space-x-1.5 bg-amber-100 px-3.5 py-1.5 rounded-full text-[11px] font-extrabold text-amber-900 tracking-wider uppercase shadow-sm/5 border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Powered by Gemini 2.5 AI</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 leading-tight">
                  Where learning feels like an <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">adventure</span>!
                </h2>
                <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Interactive learning games, textbook lessons personalized with intelligence, and gorgeous completion analytics dashboards for parents.
                </p>
              </div>

              {/* Bento Grid Portal Array */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
                
                {/* Cell A: Parent entrance (Light Bento Card - span 6) */}
                <div
                  onClick={() => setCurrentView("parent")}
                  className="md:col-span-6 bento-card p-8 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[300px] group border-slate-205/60 bg-white"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-30 group-hover:opacity-65 transition-all duration-300 pointer-events-none" />
                  <div className="space-y-4 relative z-10">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[18px] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition duration-250 border border-indigo-100/50">
                      🛠️
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-2xl text-slate-900">Parents Portal</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mt-2">
                        Create student profiles, review subject coverage charts, monitor detailed star achievements, and generate custom textbooks on any topic using Gemini.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-bold text-indigo-600 mt-6 pt-4 border-t border-slate-100/80">
                    <span>Configure Learning Center</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-all duration-200" />
                  </div>
                </div>

                {/* Cell B: Student / Child Entrance (Dark Bento Card - span 6) */}
                <div
                  onClick={() => {
                    if (profiles.length === 0) {
                      setCurrentView("parent");
                      alert("Please create at least one child profile first!");
                    } else {
                      setCurrentView("child_select");
                    }
                  }}
                  className="md:col-span-6 bento-card-dark p-8 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[300px] group border-indigo-900/40"
                >
                  <div className="absolute top-6 right-6 text-yellow-400">
                    <Sparkles className="w-8 h-8 fill-yellow-400 animate-pulse opacity-70" />
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="space-y-4 relative z-10">
                    <div className="w-14 h-14 bg-indigo-800/65 text-amber-300 rounded-[18px] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-rotate-3 transition duration-250 border border-indigo-700/50">
                      🚀
                    </div>
                    <div>
                      <h3 className="font-display font-black text-2xl text-amber-300 tracking-tight">Student Space</h3>
                      <p className="text-indigo-200/90 text-sm leading-relaxed mt-2">
                        Choose your spirit animal emoji, earn treasure badges, read lessons, chat with Sparky (your AI guide), and solve spellings, science, and math mini-games!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs font-extrabold text-amber-400 mt-6 pt-4 border-t border-indigo-900/60">
                    <span>Enter Student Space Playground</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-all duration-200" />
                  </div>
                </div>

                {/* Cell C (Auxiliary Bento detail): Stats Preview (span 4) */}
                <div className="md:col-span-4 bento-card p-6 bg-slate-50/50 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-2">
                    <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-widest font-mono">DURABLE SECURE DATA</span>
                    <h4 className="font-display font-bold text-sm text-slate-800">Firestore Persistence</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Learner progress logs and customized lesson templates are stored securely in Firestore cloud database. No accomplishments get lost!
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-indigo-650 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Cloud database synchronized</span>
                  </div>
                </div>

                {/* Cell D (Auxiliary Bento detail): Active Helper (span 4) */}
                <div className="md:col-span-4 bento-card p-6 bg-slate-50/50 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-2">
                    <span className="text-[10px] text-amber-600 font-extrabold uppercase tracking-widest font-mono">INTELLIGENT TUTOR</span>
                    <h4 className="font-display font-bold text-sm text-slate-800">Meet Sparky AI Helper</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Powered with structured context, Sparky can explain difficult vocabulary on any grade level using simplified terms.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-indigo-650 font-bold">
                    <span className="text-sm">🤖</span>
                    <span>Ready for chat support 24/7</span>
                  </div>
                </div>

                {/* Cell E (Auxiliary Bento detail): Class Variety (span 4) */}
                <div className="md:col-span-4 bento-card p-6 bg-slate-50/50 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-2">
                    <span className="text-[10px] text-cyan-600 font-extrabold uppercase tracking-widest font-mono">FLEXIBLE LESSONS</span>
                    <h4 className="font-display font-bold text-sm text-slate-800">Choose Your Subject</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      Customise spelling scramble, matching grids, quizzes, or interactive quests fitting Math, Science, and arts subjects.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-indigo-650 font-bold">
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-300" />
                    <span>Multiple mini-games variety</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ===================== VIEW 2: PARENT DASHBOARD ROUTE ===================== */}
          {currentView === "parent" && (
            <ParentDashboard
              lessons={lessons}
              onLessonAdded={(l) => setLessons((prev) => [l, ...prev])}
              profiles={profiles}
              onProfilesUpdate={setProfiles}
              progressList={progressList}
            />
          )}

          {/* ===================== VIEW 3: CHILD SELECT SCREEN ===================== */}
          {currentView === "child_select" && (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-fade-in">
              <div className="space-y-3">
                <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Who is ready to learn today? 🎒</h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">Select your custom profile to load your gold stars and continue your study adventures!</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProfile(p);
                      setCurrentView("child_dashboard");
                    }}
                    className="bento-card p-6 cursor-pointer bg-white flex flex-col items-center space-y-4 group border-slate-205 hover:bg-slate-50/50"
                  >
                    <div className="text-5xl bg-indigo-50/75 p-5 rounded-[20px] transition-all duration-200 group-hover:scale-108 group-hover:rotate-2 border border-indigo-100/50">
                      {p.avatar.split(" ")[0]}
                    </div>
                    <div>
                      <span className="font-display font-extrabold text-slate-900 text-lg group-hover:text-indigo-650 transition">{p.name}</span>
                      <div className="flex items-center justify-center space-x-1 text-xs text-amber-500 font-extrabold mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{p.totalStars} Stars</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== VIEW 4: STUDENT DASHBOARD ===================== */}
          {currentView === "child_dashboard" && activeProfile && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Profile and Stats Grid Layout (Bento structure) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Profile Box (span 7) */}
                <div className="md:col-span-7 bento-card-dark p-6 relative overflow-hidden flex flex-col justify-between min-h-[180px] border-indigo-950">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-805 rounded-full blur-3xl opacity-35 pointer-events-none" />
                  
                  <div className="flex items-center space-x-4 relative z-10">
                    <span className="text-5xl bg-indigo-800/80 p-4 rounded-[20px] border border-indigo-700/60 select-none shadow-inner">
                      {activeProfile.avatar.split(" ")[0]}
                    </span>
                    <div>
                      <span className="text-[10px] text-indigo-300 font-mono font-extrabold uppercase tracking-widest">PROUD LEARNER</span>
                      <h2 className="text-3xl font-display font-black text-amber-300 leading-none mt-1">{activeProfile.name}</h2>
                      <span className="text-[10px] bg-indigo-800/85 px-3 py-1 rounded-full text-indigo-100 font-bold font-mono tracking-wide uppercase mt-2.5 inline-block border border-indigo-700/50">
                        {activeProfile.grade} Explorer
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-indigo-800/65 pt-4 mt-6">
                    <span className="text-xs text-indigo-200">Keep on learning, genius!</span>
                    <button
                      onClick={() => {
                        setActiveProfile(null);
                        setCurrentView("child_select");
                      }}
                      className="bg-indigo-800/90 hover:bg-indigo-750/90 hover:border-slate-350 border border-indigo-700/60 text-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition duration-150 shadow-sm"
                    >
                      Switch Profile
                    </button>
                  </div>
                </div>

                {/* Stars Counter Bento box (span 5) */}
                <div className="md:col-span-5 bento-card p-6 bg-amber-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/50 pin-to-slate flex flex-col justify-between min-h-[180px] border-amber-205/65">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] text-amber-800 font-mono font-extrabold uppercase tracking-widest">TREASURE BANK</span>
                      <h3 className="text-sm font-display font-extrabold text-slate-800 mt-1">My Golden accomplishments</h3>
                    </div>
                    <Trophy className="w-8 h-8 text-amber-500 fill-amber-300 animate-bounce duration-1000" />
                  </div>

                  <div className="flex items-center space-x-3.5 mt-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <Star className="w-7 h-7 fill-amber-400 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-3xl font-black text-slate-900 leading-none">{activeProfile.totalStars}</span>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider font-extrabold">GOLD STARS UNLOCKED</span>
                    </div>
                  </div>
                  
                  <span className="text-[10px] text-amber-900 bg-amber-200/55 px-2.5 py-1 rounded-lg font-bold inline-block border border-amber-200 mt-4 text-center">
                    Earn more stars by finishing interactive quizzes!
                  </span>
                </div>

              </div>

              {/* Badge Shelf Bento style */}
              <div className="bento-card p-6 bg-white space-y-4 border-slate-100">
                <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center space-x-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <span>My Treasure Badges ({activeProfile.unlockedBadges?.length || 1})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(activeProfile.unlockedBadges || []).map((badge, bidx) => (
                    <div
                      key={bidx}
                      className="bg-slate-50/75 border border-slate-150 p-4 rounded-2xl flex items-center space-x-3 hover:bg-slate-50 transition"
                    >
                      <div className="w-12 h-12 bg-amber-400 text-white rounded-xl flex items-center justify-center text-xl shadow-sm font-extrabold select-none">
                        ⭐
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xs text-slate-900 uppercase tracking-wide">{badge.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Curriculums / Available lessons selection */}
              <div className="space-y-4 pt-4">
                <h3 className="font-display font-black text-2xl text-slate-900 flex items-center space-x-2.5">
                  <BookOpen className="w-6 h-6 text-indigo-600 animate-pulse" />
                  <span>Choose Your Today's Lesson Adventure!</span>
                </h3>

                {lessons.length === 0 ? (
                  <div className="p-8 bg-white border border-slate-150 rounded-[24px] max-w-sm text-center">
                    <p className="text-slate-500 font-semibold text-sm">Ask your Parent to create AI lessons first!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lessons.map((lesson) => {
                      const completed = progressList.some(
                        (p) => p.profileId === activeProfile.id && p.lessonId === lesson.id
                      );

                      return (
                        <div
                          key={lesson.id}
                          className="bento-card p-6 cursor-pointer bg-white flex flex-col justify-between group min-h-[225px] border-slate-205"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono tracking-wider bg-indigo-50 text-indigo-600 font-extrabold uppercase px-2.5 py-1 rounded-md border border-indigo-120/40">
                                {lesson.subject}
                              </span>
                              {completed && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-mono font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center space-x-1 border border-emerald-100">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Passed!</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-display font-black text-slate-900 text-lg group-hover:text-indigo-655 transition line-clamp-2 leading-snug">
                              {lesson.title}
                            </h4>
                            {/* Academic Alignment Badge */}
                            <div className="flex items-center space-x-1 text-[10px] font-mono text-amber-700 bg-amber-50/60 py-0.5 px-2 rounded-md border border-amber-200/50 w-fit">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="font-extrabold uppercase shrink-0">{getStandardForLesson(lesson.subject, lesson.gradeLevel).code}</span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{lesson.summary}</p>
                          </div>

                          <div className="pt-4 border-t border-slate-50 flex items-center justify-between mt-4">
                            <span className="text-[9px] text-slate-450 font-mono font-bold uppercase tracking-wider block">
                              {lesson.gameType === "matching_cards" && "🎨 MATCHING PAIRS"}
                              {lesson.gameType === "word_unscramble" && "🔤 LETTERS SCRAMBLE"}
                              {lesson.gameType === "narrative_quest" && "🧭 ADVENTURE QUEST"}
                            </span>
                            <button
                              onClick={() => enterLessonDesk(lesson)}
                              className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition duration-150 flex items-center space-x-1 shadow-sm"
                            >
                              <span>Enter</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

               {/* ===================== VIEW 5: ACTIVE STUDY DESK LAB ===================== */}
          {currentView === "study_desk" && activeLesson && activeProfile && (
            <div className="space-y-6 animate-fade-in pb-16">
              
              {/* Back actions header (Bento panel style) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-slate-100 rounded-[22px] shadow-sm">
                <button
                  onClick={() => setCurrentView("child_dashboard")}
                  className="inline-flex items-center space-x-1.5 text-slate-500 hover:text-indigo-600 font-extrabold text-xs tracking-wide uppercase font-mono transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Student Space</span>
                </button>
                <div className="flex items-center space-x-3 bg-slate-50 border border-slate-150 p-2 px-3 rounded-full">
                  <span className="text-xl select-none">{activeProfile.avatar.split(" ")[0]}</span>
                  <div className="text-xs leading-none">
                    <span className="text-[9px] text-slate-400 font-mono font-extrabold uppercase tracking-wider block mb-0.5">Studying Online</span>
                    <span className="text-slate-800 font-bold text-sm">{activeProfile.name} • {activeProfile.totalStars} ⭐</span>
                  </div>
                </div>
              </div>

              {/* Study Lab Workspace: 4 Dynamic Tabs (styled like connected Bento tabs) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-205">
                <button
                  onClick={() => setStudyTab("lesson")}
                  className={`py-3 px-3.5 rounded-xl font-display font-extrabold text-xs md:text-sm text-center transition-all duration-155 ${
                    studyTab === "lesson"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  📖 1. Read Lesson
                </button>
                <button
                  onClick={() => setStudyTab("game")}
                  className={`py-3 px-3.5 rounded-xl font-display font-extrabold text-xs md:text-sm text-center transition-all duration-155 ${
                    studyTab === "game"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  🎮 2. Play Game
                </button>
                <button
                  onClick={() => setStudyTab("quiz")}
                  className={`py-3 px-3.5 rounded-xl font-display font-extrabold text-xs md:text-sm text-center transition-all duration-155 ${
                    studyTab === "quiz"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  ✍️ 3. Take Quiz
                </button>
                <button
                  onClick={() => setStudyTab("tutor")}
                  className={`py-3 px-3.5 rounded-xl font-display font-extrabold text-xs md:text-sm text-center transition-all duration-155 ${
                    studyTab === "tutor"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  💬 AI Sparky Chat
                </button>
              </div>

              {/* Sub workspaces panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LARGE LEFT HAND AREA (Lesson / Game / Quiz) - span 8 */}
                <div className="lg:col-span-8 space-y-4">
                  
                  {/* TAB 1: TEXTBOOK READER */}
                  {studyTab === "lesson" && (() => {
                    const lessonStandard = getStandardForLesson(activeLesson.subject, activeLesson.gradeLevel);
                    return (
                      <div className="bento-card p-6 md:p-8 bg-white space-y-5 border-slate-105">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50/75 border border-indigo-100/50 px-2.5 py-1 rounded-md uppercase">
                              {activeLesson.subject}
                            </span>
                            <span className="text-[10px] font-mono font-extrabold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase">
                              {activeLesson.gradeLevel} Curriculum
                            </span>
                            <span className="text-[10px] font-mono font-extrabold text-amber-700 bg-amber-50/75 border border-amber-200/60 px-2.5 py-1 rounded-md uppercase flex items-center space-x-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                              <span>Standard: {lessonStandard.code}</span>
                            </span>
                          </div>

                          {/* WCAG/Section 508 Accessibilities Controls bar */}
                          <div className="flex items-center space-x-2 bg-slate-50/80 p-1 rounded-xl border border-slate-100">
                            {/* Read-Aloud Voice Aid */}
                            <button
                              onClick={handleToggleSpeech}
                              className={`p-1.5 rounded-lg flex items-center space-x-1 transition text-[10px] font-bold ${
                                isSpeaking
                                  ? "bg-amber-500 text-indigo-950 animate-pulse font-black"
                                  : "text-slate-600 hover:bg-slate-200"
                              }`}
                              title="Toggle Lesson Narration (Read Aloud)"
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Stop Audio</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Speech Aid</span>
                                </>
                              )}
                            </button>

                            <div className="w-px h-4 bg-slate-200 self-center" />

                            {/* Text Sizing Aids */}
                            <div className="flex items-center space-x-0.5">
                              <button
                                onClick={() => setTextSize("sm")}
                                className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${textSize === "sm" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                                title="Smaller Text"
                              >
                                A-
                              </button>
                              <button
                                onClick={() => setTextSize("md")}
                                className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${textSize === "md" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                                title="Default Text Size"
                              >
                                A
                              </button>
                              <button
                                onClick={() => setTextSize("lg")}
                                className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${textSize === "lg" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                                title="Larger Text"
                              >
                                A+
                              </button>
                              <button
                                onClick={() => setTextSize("xl")}
                                className={`p-1 px-1.5 rounded text-[10px] font-bold transition ${textSize === "xl" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-200"}`}
                                title="Extra Large Text"
                              >
                                A++
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900 leading-tight">
                            {activeLesson.title}
                          </h2>
                          {/* Academic requirements description tag */}
                          <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wide">
                            State Aligned Standard: {lessonStandard.system} ({lessonStandard.code}) • {lessonStandard.desc}
                          </p>
                        </div>

                        {/* Render text with Markdown support with adjustable font hierarchy */}
                        <article 
                          id="lesson_content_markdown" 
                          className={`prose prose-slate max-w-none text-slate-750 leading-relaxed border-t border-slate-100 pt-5 transition-all duration-150 ${
                            textSize === "sm" ? "text-xs md:text-sm prose-sm" : 
                            textSize === "md" ? "text-sm md:text-base" : 
                            textSize === "lg" ? "text-base md:text-lg prose-lg" : 
                            "text-lg md:text-xl prose-xl"
                          }`}
                        >
                          <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                        </article>

                        <div className="bg-amber-50/60 p-5 rounded-[20px] border border-amber-205 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                          <div>
                            <h4 className="font-display font-bold text-sm text-amber-900">Have you finished reading?</h4>
                            <p className="text-xs text-amber-800/80 mt-1">Advance to the Practice Game playground to earn gold star coins!</p>
                          </div>
                          <button
                            onClick={() => setStudyTab("game")}
                            className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shrink-0 shadow-sm transition"
                          >
                            Step 2: Play Game 🎮
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TAB 2: INTERACTIVE PRACTICE GAME */}
                  {studyTab === "game" && (
                    <InteractiveGame
                      lesson={activeLesson}
                      onGameComplete={handleGameCompletion}
                    />
                  )}

                  {/* TAB 3: DYNAMIC ASSIGNMENT QUIZ */}
                  {studyTab === "quiz" && (
                    <div className="bento-card p-6 bg-white space-y-6 border-slate-205">
                      
                      {!quizCompleted ? (
                        <>
                          <div className="flex justify-between items-center text-xs font-mono font-extrabold text-indigo-600 border-b border-slate-100 pb-3">
                            <span>QUESTION {quizQuestionIndex + 1} OF {activeLesson.quiz.length}</span>
                            <span>CORRECT SCORE: {quizScore} / {activeLesson.quiz.length}</span>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-display font-black text-lg md:text-xl text-slate-900">
                              {activeLesson.quiz[quizQuestionIndex]?.question}
                            </h3>

                            {/* Options cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                              {activeLesson.quiz[quizQuestionIndex]?.options.map((optionStr, oidx) => {
                                const isCorrectAnswer = oidx === activeLesson.quiz[quizQuestionIndex]?.correctIndex;
                                const isSelected = quizSelectedOption === oidx;
                                
                                let cardBorder = "border-slate-200 hover:border-indigo-400";
                                let cardBg = "bg-white hover:bg-slate-50/50";
                                let badgeIcon = <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;

                                if (quizShowFeedback) {
                                  if (isCorrectAnswer) {
                                    cardBorder = "border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold";
                                    cardBg = "";
                                    badgeIcon = <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
                                  } else if (isSelected) {
                                    cardBorder = "border-rose-455 bg-rose-50/40 text-rose-950";
                                    cardBg = "";
                                    badgeIcon = <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
                                  } else {
                                    cardBorder = "border-slate-100 opacity-60";
                                    cardBg = "bg-white";
                                  }
                                }

                                return (
                                  <button
                                    key={oidx}
                                    disabled={quizShowFeedback}
                                    onClick={() => handleQuizAnswerSelect(oidx)}
                                    className={`w-full text-left p-4 rounded-xl border transition text-sm flex items-start space-x-3 duration-100 outline-none ${cardBorder} ${cardBg}`}
                                  >
                                    {badgeIcon}
                                    <span>{optionStr}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Tutor explanations feed */}
                          {quizShowFeedback && (
                            <div className="bg-indigo-50/60 border border-indigo-100 p-5 rounded-2xl space-y-3 animate-pop">
                              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-indigo-700 block">
                                Sparky's Diagnostic Feedback 🤖
                              </span>
                              <p className="text-slate-800 text-xs md:text-sm leading-relaxed">
                                {activeLesson.quiz[quizQuestionIndex]?.explanation || "Wonderful attempt! review explanations and tap below to proceed!"}
                              </p>
                              <div className="text-right pt-2">
                                <button
                                  onClick={handleNextQuizQuestion}
                                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm inline-flex items-center space-x-1"
                                >
                                  <span>Continue</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 space-y-5">
                          <div className="text-6xl bg-amber-50 p-4 rounded-full inline-block animate-bounce">
                            🎉
                          </div>
                          <h3 className="font-display font-black text-2xl text-slate-900">Comprehension Quiz Completed!</h3>
                          
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <p className="text-slate-500 text-sm max-w-sm">
                              You successfully answered {quizScore} out of {activeLesson.quiz.length} questions correctly!
                            </p>
                            
                            <div className="bg-amber-100/60 px-5 py-3 rounded-full font-black text-amber-900 inline-flex items-center space-x-1.5 border border-amber-200">
                              <Star className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse" />
                              <span>Earned +{quizScore * 2 + 5} Golden Star Rewards!</span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button
                              onClick={() => setShowCertificateModal(true)}
                              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 active:scale-95 text-indigo-950 font-black px-6 py-2.5 rounded-xl transition text-xs shadow-md shadow-amber-500/20 inline-flex items-center justify-center space-x-2"
                            >
                              <Award className="w-4 h-4 fill-amber-950 text-amber-950" />
                              <span>Print Certificate 🏆</span>
                            </button>
                            <button
                              onClick={resetQuiz}
                              className="w-full sm:w-auto bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100/75 font-bold px-6 py-2.5 rounded-xl border border-indigo-200 transition text-xs font-mono"
                            >
                              Retake Quiz
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 4: CHAT WITH SPARKY ONLINE */}
                  {studyTab === "tutor" && (
                    <AITutorChat
                      lessonTitle={activeLesson.title}
                      subject={activeLesson.subject}
                      gradeLevel={activeLesson.gradeLevel}
                      childName={activeProfile.name}
                    />
                  )}

                </div>

                {/* TUTOR QUICK ACCESS SIDEBAR (Always on display for quick support except on tutor tab) - span 4 */}
                <div className="lg:col-span-4 space-y-4">
                  {studyTab !== "tutor" && (
                    <div className="bento-card-dark p-5 border-indigo-950 space-y-4 relative overflow-hidden">
                      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-400/5 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center space-x-2.5 relative z-10">
                        <div className="w-9 h-9 bg-amber-400 text-indigo-950 rounded-full flex items-center justify-center text-lg font-bold shadow-sm select-none">
                          🤖
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-xs text-white tracking-wider">SPARKY DESK</h4>
                          <span className="text-[9px] text-amber-400 font-mono font-bold uppercase tracking-widest block">AI Study Assistant</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-indigo-200/90 leading-relaxed relative z-10">
                        Need quick explanations on difficult words? Tap below or switch to the tutor tab to speak with Sparky 24/7!
                      </p>

                      <button
                        onClick={() => setStudyTab("tutor")}
                        className="w-full bg-amber-400 text-indigo-950 border border-white hover:bg-amber-305 hover:scale-[1.02] transition duration-200 rounded-xl py-2.5 text-xs font-black relative z-10 shadow-sm"
                      >
                        Ask Sparky a Question 💬
                      </button>
                    </div>
                  )}

                  {/* Quiz guidelines / Class instructions (Light Bento cell) */}
                  <div className="bento-card p-5 bg-white space-y-3 border-slate-150">
                    <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block">Class Guidelines</span>
                    <ul className="text-xs text-slate-500 space-y-2.5 list-disc list-inside leading-relaxed">
                      <li>Read Chapter textbook notes in full first.</li>
                      <li>Complete the practice game to master terms.</li>
                      <li>Take the 3-Question Lesson Quiz to finalize.</li>
                      <li>Earn maximum gold stars for high correctness.</li>
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-8 text-center text-xs text-slate-400 mt-20">
        <p className="font-mono tracking-tight text-[11px]">© 2026 Homeschool Learning Hub Inc. Structured cloud curricula powered by Antigravity and Gemini API.</p>
      </footer>

      {/* CERTIFICATE MODAL */}
      {showCertificateModal && activeProfile && activeLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in hide-on-print print:p-0 print:bg-white print:static print:inset-auto print:z-0">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-150 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 hide-on-print">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                <span className="font-display font-extrabold text-slate-800 text-sm">Certificate of Achievement Preview</span>
              </div>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="p-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                aria-label="Close modal"
              >
                <XCircle className="w-4 h-4" />
                <span>Exit Preview</span>
              </button>
            </div>

            {/* Certificate viewport area */}
            <div className="p-4 md:p-10 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 print:bg-white print:p-0">
              <div 
                id="print-certificate-area" 
                className="relative bg-white border-[12px] border-amber-500/25 p-6 md:p-12 w-full max-w-3xl aspect-[1.414/1] rounded-2xl shadow-md ring-1 ring-amber-500/10 flex flex-col justify-between text-center overflow-hidden print:shadow-none print:rounded-none print:border-[4px] print:border-double print:border-amber-500"
              >
                
                {/* Vintage Border Corners */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-amber-500/30 rounded-tl-lg m-4 pointer-events-none select-none print:m-1" />
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-amber-500/30 rounded-tr-lg m-4 pointer-events-none select-none print:m-1" />
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-amber-500/30 rounded-bl-lg m-4 pointer-events-none select-none print:m-1" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-amber-500/30 rounded-br-lg m-4 pointer-events-none select-none print:m-1" />

                {/* Subdued watermarks */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <GraduationCap className="w-80 h-80 text-indigo-900" />
                </div>

                <div className="space-y-3 relative z-10">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] tracking-[0.2em] font-mono font-black text-amber-600 block uppercase mb-1">
                      HOMESCHOOL LEARNING PLAYGROUND
                    </span>
                    <h1 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-indigo-950 tracking-wide leading-none uppercase">
                      Certificate of Achievement
                    </h1>
                    <div className="w-20 h-1 bg-amber-500/40 my-2 rounded-full mx-auto" />
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                      CURRICULUM CONCEPT MASTERY
                    </p>
                  </div>

                  <div className="space-y-1.5 mt-4">
                    <p className="text-slate-500 italic text-xs font-sans">
                      This academic credential is proudly presented to
                    </p>
                    <h2 className="font-display font-black text-3xl md:text-4xl text-emerald-600 tracking-tight leading-none py-1">
                      {activeProfile.name}
                    </h2>
                    <div className="max-w-md mx-auto border-t border-dashed border-slate-200 pt-3">
                      <p className="text-[11px] md:text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                        for executing active lesson focus, full textbook reading, interactive practice game completion, and successfully attaining high scoring marks on:
                      </p>
                      <p className="text-sm md:text-base font-display font-black text-indigo-950 mt-2 italic">
                        “{activeLesson.title}”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Verification row */}
                <div className="grid grid-cols-3 items-end gap-2 mt-6 relative z-10 text-left">
                  
                  {/* Cursive Signature 1 */}
                  <div className="flex flex-col items-center text-center space-y-1 font-sans">
                    <span className="italic text-slate-700 font-bold tracking-wide">Sparky 🤖</span>
                    <div className="w-full border-t border-slate-200" />
                    <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">AI Platform Guide</span>
                  </div>

                  {/* Golden Stamped Badge */}
                  <div className="flex flex-col items-center text-center justify-center relative -top-2">
                    <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-400 border-4 border-white flex flex-col items-center justify-center shadow-md select-none">
                      <Star className="w-5 h-5 fill-amber-955 text-indigo-950 stroke-[2.5]" />
                      <span className="text-[8px] font-mono font-black text-indigo-950 leading-none mt-0.5">{quizScore} / {activeLesson.quiz.length}</span>
                    </div>
                    <span className="text-[8px] text-indigo-950 font-black tracking-wider uppercase mt-2">OFFICIAL SEAL</span>
                  </div>

                  {/* Representative Signature 2 */}
                  <div className="flex flex-col items-center text-center space-y-1 font-sans">
                    <span className="italic text-slate-705 font-bold tracking-wide">Homeschool Hub</span>
                    <div className="w-full border-t border-slate-200" />
                    <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">Curriculum Director</span>
                  </div>

                </div>

                {/* Granted stats footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-3 mt-4 relative z-10 select-none">
                  <span>DATE: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>ID: HLH-QL-{activeProfile.id?.slice(0, 5).toUpperCase() || "OK"}-{activeLesson.id?.slice(0, 4).toUpperCase() || "OK"}</span>
                </div>

              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-end space-x-2.5 px-6 py-4 bg-slate-50 border-t border-slate-100 hide-on-print">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-indigo-950 font-black px-5 py-2 rounded-xl transition text-xs shadow-md shadow-amber-500/20 inline-flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-950" />
                <span>Print Certificate</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

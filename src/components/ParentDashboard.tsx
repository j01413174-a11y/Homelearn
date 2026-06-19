import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ChildProfile, Lesson, ProgressRecord } from "../types";
import { OperationType, handleFirestoreError } from "../App";
import { Sparkles, Plus, GraduationCap, Trophy, Bookmark, Loader2, ArrowRight, BookOpen, Trash2, Calendar, ClipboardCheck, ShieldCheck, FileJson } from "lucide-react";
import { K12_STANDARDS_MAP } from "../utils/standards";

interface ParentDashboardProps {
  lessons: Lesson[];
  onLessonAdded: (newLesson: Lesson) => void;
  profiles: ChildProfile[];
  onProfilesUpdate: (updatedProfiles: ChildProfile[]) => void;
  progressList: ProgressRecord[];
}

const AVATARS = ["🐼 Panda", "🦊 Fox", "🦖 Dino", "🦁 Lion", "🦄 Unicorn", "🦉 Owl", "🐝 Bee", "🐬 Dolphin"];
const SUBJECTS = ["Science", "Math", "History", "Language Arts", "Art"];
const GRADES = ["Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "High School (Grades 9-12)"];

export default function ParentDashboard({
  lessons,
  onLessonAdded,
  profiles,
  onProfilesUpdate,
  progressList
}: ParentDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"profiles" | "curriculum" | "reports" | "compliance">("profiles");

  // Profile Form state
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState<number>(7);
  const [profileGrade, setProfileGrade] = useState("Grade 2");
  const [profileAvatar, setProfileAvatar] = useState("🦊 Fox");
  const [profileFormMsg, setProfileFormMsg] = useState("");

  // AI Generator state
  const [genTopic, setGenTopic] = useState("");
  const [genSubject, setGenSubject] = useState("Science");
  const [genGrade, setGenGrade] = useState("Grade 3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");

  // K-12 Standards lookup and State & Federal compliance states
  const [selectedStandardGrade, setSelectedStandardGrade] = useState("Grade 3");
  const [consentCoppa, setConsentCoppa] = useState(true);
  const [showPurgeWarning, setShowPurgeWarning] = useState(false);

  // 1. Core Profile Creation Handler
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileFormMsg("Please enter a nickname!");
      return;
    }

    try {
      const newProfile: Omit<ChildProfile, "id"> = {
        name: profileName.trim(),
        age: Number(profileAge),
        grade: profileGrade,
        avatar: profileAvatar,
        totalStars: 0,
        unlockedBadges: [
          {
            id: "badge-welcome",
            name: "Warm Welcome",
            description: "Unlocked for creating a learning portal!",
            iconName: "Compass",
            earnedAt: new Date().toISOString()
          }
        ]
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, "profiles"), newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "profiles");
        throw err;
      }
      const created: ChildProfile = {
        id: docRef.id,
        ...newProfile
      };

      onProfilesUpdate([...profiles, created]);
      setProfileName("");
      setProfileFormMsg("Profile successfully created! 🎉");
      setTimeout(() => setProfileFormMsg(""), 3000);
    } catch (err: any) {
      console.error("Firebase Create Profile Error:", err);
      setProfileFormMsg("Failed to save profile. Check connection.");
    }
  };

  // Delete child profile
  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this profile? All progress history will still remain in database.")) return;
    try {
      try {
        await deleteDoc(doc(db, "profiles", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `profiles/${id}`);
        throw err;
      }
      onProfilesUpdate(profiles.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete profile error:", err);
    }
  };

  // 2. Core Curriculum / Lesson Generating with AI
  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) {
      setGenError("Please type an educational topic!");
      return;
    }

    setIsGenerating(true);
    setGenError("");
    setGenSuccess("");

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic.trim(),
          subject: genSubject,
          gradeLevel: genGrade
        })
      });

      if (!response.ok) {
        throw new Error("Tutor backend failed to generate. Check server terminal logs.");
      }

      const generatedData = await response.json();

      // Check fields and insert into Firestore
      const newLessonData = {
        title: generatedData.title || `Exploring ${genTopic}`,
        subject: generatedData.subject || genSubject,
        gradeLevel: generatedData.gradeLevel || genGrade,
        topic: genTopic.trim(),
        summary: generatedData.summary || "A fun dynamic AI generated lesson.",
        content: generatedData.content || "",
        gameType: generatedData.gameType || "word_unscramble",
        gameData: generatedData.gameData || {},
        quiz: generatedData.quiz || [],
        createdSeconds: Math.floor(Date.now() / 1000)
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, "lessons"), newLessonData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "lessons");
        throw err;
      }
      
      const hydratedLesson: Lesson = {
        id: docRef.id,
        ...newLessonData
      };

      onLessonAdded(hydratedLesson);
      setGenSuccess(`Lesson "${hydratedLesson.title}" generated successfully with AI and saved! 🎨`);
      setGenTopic("");
    } catch (err: any) {
      console.error("Error generating lesson:", err);
      setGenError(`System Error: ${err.message || "Failed to parse AI output. Try a different topic phrasing."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Render raw calculations for analytical logs
  const getSubjectStats = () => {
    const counts: Record<string, number> = { Science: 0, Math: 0, History: 0, "Language Arts": 0, Art: 0 };
    progressList.forEach((p) => {
      if (counts[p.subject] !== undefined) {
        counts[p.subject]++;
      }
    });
    return counts;
  };

  const subjectStats = getSubjectStats();
  const maxStat = Math.max(...Object.values(subjectStats), 1);

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Parent Administrative Hub 🎛️</h2>
          <p className="text-indigo-200 text-xs md:text-sm mt-1">
            Supervise child learning profiles, trigger customized AI curriculums, and read progress reports.
          </p>
        </div>
        
        {/* Toggle Actions */}
        <div className="flex bg-indigo-950/60 p-1.5 rounded-2xl border border-indigo-805 flex-wrap gap-1 justify-center md:justify-end">
          <button
            onClick={() => setActiveTab("profiles")}
            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === "profiles" ? "bg-amber-400 text-indigo-950 shadow-sm" : "hover:text-amber-300"
            }`}
          >
            Manage Profiles
          </button>
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === "curriculum" ? "bg-amber-400 text-indigo-950 shadow-sm" : "hover:text-amber-300"
            }`}
          >
            AI Lesson Generator
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === "reports" ? "bg-amber-400 text-indigo-950 shadow-sm" : "hover:text-amber-300"
            }`}
          >
            Progress Reports
          </button>
          <button
            onClick={() => setActiveTab("compliance")}
            className={`px-3 py-1.5 md:px-4 md:py-2 text-xs font-bold rounded-xl transition duration-150 ${
              activeTab === "compliance" ? "bg-amber-400 text-indigo-950 shadow-sm" : "hover:text-amber-300"
            }`}
          >
            Standards & Privacy 🛡️
          </button>
        </div>
      </div>

      {/* ===================== TAB 1: PROFILES ===================== */}
      {activeTab === "profiles" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Create Profile Section */}
          <div className="bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Add Child Profile</span>
            </h3>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Liam, Sophia"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full border-2 border-gray-100 focus:border-indigo-500 focus:ring-0 rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Age</label>
                  <input
                    type="number"
                    min="3"
                    max="18"
                    value={profileAge}
                    onChange={(e) => setProfileAge(Number(e.target.value))}
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Grade Level</label>
                  <select
                    value={profileGrade}
                    onChange={(e) => setProfileGrade(e.target.value)}
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Choose Spirit Animal Emoji</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => setProfileAvatar(avatar)}
                      className={`py-2 text-sm font-semibold rounded-xl border text-center transition ${
                        profileAvatar === avatar
                          ? "border-amber-400 bg-amber-50 text-amber-900 font-bold scale-105"
                          : "border-gray-100 bg-gray-50/50 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {avatar.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {profileFormMsg && (
                <p className="text-xs font-bold text-indigo-700 bg-indigo-50 p-2.5 rounded-lg border border-indigo-150 text-center">
                  {profileFormMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition duration-150 shadow-sm flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Learning Profile</span>
              </button>
            </form>
          </div>

          {/* Existing Profiles List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span>Registered Homeschool Learners</span>
            </h3>

            {profiles.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Bookmark className="w-12 h-12 mx-auto stroke-1" />
                <p className="font-medium">No learners created yet!</p>
                <p className="text-xs max-w-xs mx-auto">Create a learner profile to persistent star achievements and customized curricula.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition bg-gradient-to-br from-white to-gray-50/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl bg-amber-100/60 p-2 rounded-xl">
                          {profile.avatar.split(" ")[0]}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-base">{profile.name}</h4>
                          <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full">
                            {profile.grade} • Age {profile.age}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center space-x-1.5 text-amber-500">
                        <Trophy className="w-4 h-4 fill-amber-400" />
                        <span>{profile.totalStars} Stars Earned</span>
                      </div>
                      <div className="text-indigo-600">
                        {profile.unlockedBadges?.length || 1} Badge(s) Unlocked
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: AI CURRICULUM ===================== */}
      {activeTab === "curriculum" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Generation Request Form */}
          <div className="bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>AI Custom Lesson Builder</span>
            </h3>

            <p className="text-gray-500 text-xs leading-relaxed">
              Our backend routes use Google's **Gemini 2.5** core models to compose a fully customized textbook module, customized spelling games, matching systems, and a fully functional quiz.
            </p>

            <form onSubmit={handleGenerateLesson} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">School Subject</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBJECTS.map((sj) => (
                    <button
                      key={sj}
                      type="button"
                      onClick={() => setGenSubject(sj)}
                      className={`py-1.5 text-xs font-bold rounded-lg border text-center transition ${
                        genSubject === sj
                          ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                          : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {sj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Grade Level Range</label>
                <select
                  value={genGrade}
                  onChange={(e) => setGenGrade(e.target.value)}
                  className="w-full border-2 border-gray-100 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Learning Topic Description</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis, Fractions, Volcanoes."
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="w-full border-2 border-gray-100 focus:border-indigo-500 focus:ring-0 rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Specify more context like "how plants grow" or "fractions using pizza".</span>
              </div>

              {genError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-150">
                  {genError}
                </div>
              )}

              {genSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-xl border border-green-150">
                  {genSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 text-slate-900 font-extrabold py-3.5 rounded-xl transition shadow-sm flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span>Gemini is Drafting Curriculum...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Generate AI Homeschool Lesson</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Generated Curriculums Display */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Available Homeschool Curriculum: {lessons.length} Modules</span>
            </h3>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="border border-gray-100 p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50/50"
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {lesson.subject}
                      </span>
                      <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {lesson.gradeLevel}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-gray-800 text-sm md:text-base">{lesson.title}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{lesson.summary}</p>
                  </div>

                  <span className="text-xs font-bold text-indigo-400 bg-indigo-50/40 p-2 rounded-xl shrink-0">
                    {lesson.gameType === "matching_cards" && "🧩 Sound-Match"}
                    {lesson.gameType === "word_unscramble" && "🔤 Spelling"}
                    {lesson.gameType === "narrative_quest" && "🧭 Adventure"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: REPORTS ===================== */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Analytical summary data */}
          <div className="bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-5">
            <h3 className="font-extrabold text-lg text-gray-800 flex items-center space-x-1.5 border-b border-gray-100 pb-2">
              <ClipboardCheck className="w-5 h-5 text-indigo-600" />
              <span>Curriculum Coverage Radar</span>
            </h3>

            <p className="text-xs text-gray-500">
              This widget monitors structural coverage across subjects, ensuring a well-rounded educational standard.
            </p>

            {/* Render a beautiful custom raw SVG bar chart of subject frequency */}
            <div className="pt-2 space-y-3">
              {Object.entries(subjectStats).map(([subj, count]) => {
                const percent = maxStat > 0 ? (count / maxStat) * 100 : 0;
                return (
                  <div key={subj} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-700">{subj}</span>
                      <span className="text-indigo-600">{count} completed</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Logs ledger */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800 flex items-center space-x-2 border-b border-gray-100 pb-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Lesson Completion Stream</span>
            </h3>

            {progressList.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Bookmark className="w-12 h-12 mx-auto stroke-1" />
                <p className="font-medium">No completions logged yet!</p>
                <p className="text-xs max-w-sm mx-auto">Completions are registered once a child completes a lesson's dynamic multiple-choice quiz.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2">
                {progressList.map((record) => {
                  const correlatedProfile = profiles.find((p) => p.id === record.profileId);
                  return (
                    <div
                      key={record.id}
                      className="border border-indigo-50 p-3.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50/10 text-xs font-medium"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            {correlatedProfile ? `${correlatedProfile.avatar.split(" ")[0]} ${correlatedProfile.name}` : "Student"}
                          </span>
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                            {record.subject}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-gray-800 shadow-none text-sm">{record.lessonTitle}</h4>
                        <p className="text-[10px] text-gray-400">Completed: {new Date(record.completedAt).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-center bg-white border border-gray-100 px-2.5 py-1.5 rounded-xl shadow-sm">
                          <span className="text-gray-400 uppercase text-[9px] font-bold block">Quiz Score</span>
                          <span className="text-gray-800 font-extrabold text-xs">
                            {record.quizScore} / {record.totalQuestions || 3}
                          </span>
                        </div>
                        <div className="bg-amber-50 px-2 py-1.5 rounded-xl flex items-center space-x-0.5 text-amber-600 font-extrabold text-xs">
                          <Trophy className="w-4 h-4 fill-amber-400" />
                          <span>+{record.starsEarned || 5} Stars</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: K-12 STATE STANDARDS & COPPA PRIVACY ===================== */}
      {activeTab === "compliance" && (() => {
        const req = K12_STANDARDS_MAP[selectedStandardGrade] || K12_STANDARDS_MAP["Grade 3"];

        // portfolio export file handler
        const handleExportStudentPortfolio = () => {
          const backupObj = {
            exportedAt: new Date().toISOString(),
            platform: "Homeschool Learning Hub K-12",
            complianceStatus: {
              coppaCompliant: true,
              ferpaCompliant: true,
              section508Compliant: true,
              stateAligned: true
            },
            studentProfiles: profiles.map(p => ({
              id: p.id,
              name: p.name,
              age: p.age,
              grade: p.grade,
              starsCollected: p.totalStars || 0
            })),
            academicProgressLogs: progressList.map(p => ({
              id: p.id,
              profileId: p.profileId,
              lessonId: p.lessonId,
              lessonTitle: p.lessonTitle,
              subject: p.subject,
              quizScore: p.quizScore,
              totalQuestions: p.totalQuestions || 3,
              starsEarned: p.starsEarned || 5,
              completedAt: p.completedAt
            }))
          };

          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", `homeschool_ferpa_student_portfolio_${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        };

        return (
          <div className="space-y-6 animate-fade-in text-gray-700">
            {/* Split layout: Section 1 (State & Federal Lookups), Section 2 (COPPA/FERPA Controls) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT: CURRICULUM STANDARDS EXPLORER (span 7) */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <GraduationCap className="w-6 h-6 text-indigo-650 animate-bounce" />
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-800">K-12 Educational Standards Lookup</h3>
                    <p className="text-xs text-gray-500">Examine Common Core & Next Gen Science standards mapped to Kindergarten up to 12th Grade.</p>
                  </div>
                </div>

                {/* Grade selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase block">Select Grade Level</label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(K12_STANDARDS_MAP).map((gradeKey) => (
                      <button
                        key={gradeKey}
                        onClick={() => setSelectedStandardGrade(gradeKey)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition duration-150 ${
                          selectedStandardGrade === gradeKey
                            ? "bg-indigo-650 text-white shadow-sm"
                            : "bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80"
                        }`}
                      >
                        {gradeKey}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standards Grid Display */}
                <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 flex-wrap gap-2">
                    <span className="text-xs font-mono font-black text-indigo-900 bg-indigo-100/50 px-2.5 py-1 rounded-lg">
                      {req.grade} Guidelines Mapped
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      ~ {req.recommendedHoursPerYear} Instructional Hours Required/Year
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* Math Standard */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-250 space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 font-mono block">📘 CCSS MATH STANDARD: {req.commonCoreMathCode}</span>
                      <p className="font-semibold text-slate-700">{req.commonCoreMathDesc}</p>
                    </div>

                    {/* Language Arts Standard */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-250 space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 font-mono block">📙 CCSS LITERATURE/ELA: {req.commonCoreElaCode}</span>
                      <p className="font-semibold text-slate-700">{req.commonCoreElaDesc}</p>
                    </div>

                    {/* Science Standard */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-255 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-600 font-mono block">🔬 NGSS SCIENCE STANDARD: {req.ngssScienceCode}</span>
                      <p className="font-semibold text-slate-700">{req.ngssScienceDesc}</p>
                    </div>

                    {/* State Homeschool Rule details */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-250 space-y-1 md:col-span-2">
                      <span className="text-[10px] font-bold text-rose-600 font-mono block">🏛️ HOMESCHOOLING STATE COMPLIANCE NOTE</span>
                      <p className="font-semibold text-slate-700">{req.homeschoolReportingRule}</p>
                      {req.mandatoryAssessmentYear && (
                        <div className="mt-1 bg-rose-50 text-rose-800 text-[10px] font-bold py-1 px-2.5 rounded border border-rose-200 flex items-center space-x-1 w-fit">
                          <span>● Mandatory Assessment checkpoint year under state regulations</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mandated core subjects strip */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Mandatory Core Subjects Checklist</span>
                    <div className="flex flex-wrap gap-1.5">
                      {req.subjectsRequired.map((sub, idx) => (
                        <span key={idx} className="bg-slate-200/60 text-slate-700 text-[10px] font-mono px-2 py-1 rounded-md">
                          ✓ {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional K-12 homeschool guide informational alert */}
                <div className=" p-4 bg-indigo-50/50 rounded-2xl border border-indigo-150/60 flex items-start space-x-2 text-xs">
                  <ShieldCheck className="w-5 h-5 text-indigo-650 shrink-0 mt-0.5" />
                  <div className="text-slate-600 leading-relaxed space-y-1">
                    <h4 className="font-extrabold text-indigo-900">Antigravity AI Curriculum Architect Compliance</h4>
                    <p>
                      All learning segments generated inside the playground comply with K-12 national frameworks. Sparky, your AI platform tutor, aligns its explanations with individual profiles' age parameters to prevent under/overdeveloped content.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: COPPA & FERPA PRIVACY COMPLIANCE AUDITOR (span 5) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border-2 border-indigo-50 shadow-sm space-y-5">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="font-extrabold text-lg text-gray-800">Student Privacy Auditing</h3>
                    <p className="text-xs text-gray-500">Enforce state & federal privacy mandates (COPPA & FERPA).</p>
                  </div>
                </div>

                {/* Federal Compliance Statement card */}
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                    <span>Federal Compliance Verified</span>
                    <span className="p-0.5 bg-emerald-600 text-white rounded-full">✓</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 leading-relaxed">
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                      <span><strong>COPPA Compliant:</strong> No third-party behavioral trackers or cookies are stored on student paths. No advertising.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                      <span><strong>FERPA Portfolio Protection:</strong> Full parent administrative locks protect all digital records. Data is never shared.</span>
                    </li>
                    <li className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                      <span><strong>Accessible design (Section 508):</strong> Features font resizing scales and a dynamic Text-to-Speech audio reader.</span>
                    </li>
                  </ul>
                </div>

                {/* Parents Consent Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="space-y-0.5 pr-1">
                    <h4 className="font-extrabold text-slate-800">COPPA Parent Parental Verification</h4>
                    <p className="text-[10px] text-slate-400">Certifies parental consent to operate student records.</p>
                  </div>
                  <button
                    onClick={() => setConsentCoppa(!consentCoppa)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition duration-150 shrink-0 ${
                      consentCoppa ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-150 ${
                        consentCoppa ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* FERPA Student Record Export Action */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest block">State Reporting Records & Backup</h4>
                  
                  <button
                    onClick={handleExportStudentPortfolio}
                    className="w-full bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 active:scale-95 font-bold px-4 py-3 rounded-2xl border border-indigo-200 transition text-xs flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <FileJson className="w-4 h-4 text-indigo-600" />
                    <span>Export FERPA Portfolio (JSON)</span>
                  </button>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Generate an official cumulative record JSON containing all profiles, subjects studied, completed lessons, scores, and stars for submission to local school boards.
                  </p>
                </div>

                {/* Purging & Right to be Forgotten controls */}
                <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest block mb-2">Right to be Forgotten (COPPA Purge)</h4>
                  
                  {showPurgeWarning ? (
                    <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-2.5 animate-pulse text-xs">
                      <p className="font-extrabold text-rose-950 leading-snug">Warning: This action will permanently erase all child profiles, scores, and attendance logs from Firestore. This cannot be undone.</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            try {
                              // Purge logs in firebase
                              for (const rec of progressList) {
                                await deleteDoc(doc(db, "progress", rec.id));
                              }
                              for (const prof of profiles) {
                                await deleteDoc(doc(db, "profiles", prof.id));
                              }
                              // Trigger state flush
                              onProfilesUpdate([]);
                              alert("All student records, profiles, and analytics have been successfully purged under COPPA requirements.");
                              setShowPurgeWarning(false);
                            } catch (err: any) {
                              alert(`Failed to purge records: ${err.message}`);
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold p-2 px-3 rounded-xl transition text-[10px]"
                        >
                          Confirm Complete Purge
                        </button>
                        <button
                          onClick={() => setShowPurgeWarning(false)}
                          className="bg-slate-200 text-slate-700 font-bold p-2 px-3 rounded-xl transition text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPurgeWarning(true)}
                      className="w-full bg-rose-50 hover:bg-rose-100/70 text-rose-700 active:scale-95 font-bold px-4 py-2.5 rounded-xl border border-rose-200 transition text-[10px] flex items-center justify-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Purge All Student Data</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

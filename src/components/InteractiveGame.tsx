import React, { useState, useEffect } from "react";
import { GameData, Lesson } from "../types";
import { Star, Trophy, RefreshCw, CheckCircle2, AlertCircle, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

interface InteractiveGameProps {
  lesson: Lesson;
  onGameComplete: (starsEarned: number) => void;
}

export default function InteractiveGame({ lesson, onGameComplete }: InteractiveGameProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [starsEarned, setStarsEarned] = useState(0);
  const [gameResult, setGameResult] = useState<{ success: boolean; msg: string } | null>(null);

  // --- 1. Matching Cards State ---
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongMatch, setWrongMatch] = useState<boolean>(false);
  const [matchStatusMsg, setMatchStatusMsg] = useState<string>("");

  // Shuffle Left and Right cards separately
  const [leftCards, setLeftCards] = useState<any[]>([]);
  const [rightCards, setRightCards] = useState<any[]>([]);

  // --- 2. Word Unscramble State ---
  const [unscrambleLevel, setUnscrambleLevel] = useState(0);
  const [unscrambleLetters, setUnscrambleLetters] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]); // indexes in unscrambleLetters
  const [unscrambleFeedback, setUnscrambleFeedback] = useState<string>("");
  const [unscrambleStatus, setUnscrambleStatus] = useState<"playing" | "correct" | "completed">("playing");

  // --- 3. Narrative Quest State ---
  const [questStep, setQuestStep] = useState(0);
  const [questFeedback, setQuestFeedback] = useState<string>("");
  const [questSuccessState, setQuestSuccessState] = useState<boolean | null>(null);

  // Initialize Game on Lesson Change
  useEffect(() => {
    resetGame();
  }, [lesson]);

  const resetGame = () => {
    setIsPlaying(true);
    setStarsEarned(0);
    setGameResult(null);

    // Matching Match init
    if (lesson.gameType === "matching_cards" && lesson.gameData.matchingCards) {
      const cards = lesson.gameData.matchingCards;
      const shuffledLeft = [...cards].sort(() => Math.random() - 0.5);
      const shuffledRight = [...cards].sort(() => Math.random() - 0.5);
      setLeftCards(shuffledLeft);
      setRightCards(shuffledRight);
      setMatchedIds([]);
      setSelectedLeft(null);
      setSelectedRight(null);
      setMatchStatusMsg("Tap a card of the left column, then tap its match on the right column!");
    }

    // Word Unscramble init
    if (lesson.gameType === "word_unscramble" && lesson.gameData.wordUnscramble) {
      setUnscrambleLevel(0);
      initUnscramble(0);
    }

    // Narrative Quest init
    if (lesson.gameType === "narrative_quest") {
      setQuestStep(0);
      setQuestFeedback("");
      setQuestSuccessState(null);
    }
  };

  // Matching game item click handler
  const handleLeftSelect = (id: string) => {
    if (matchedIds.includes(id)) return;
    setSelectedLeft(id);
    setWrongMatch(false);
  };

  const handleRightSelect = (id: string) => {
    if (matchedIds.includes(id)) return;
    if (!selectedLeft) {
      setMatchStatusMsg("Pick a card from the left side first!");
      return;
    }
    setSelectedRight(id);
    setWrongMatch(false);

    // Verify Match
    if (selectedLeft === id) {
      // Success match
      const updated = [...matchedIds, id];
      setMatchedIds(updated);
      setMatchStatusMsg("Correct Match! Awesome job! 🎉");
      setSelectedLeft(null);
      setSelectedRight(null);

      if (updated.length === (lesson.gameData.matchingCards?.length || 0)) {
        // Game complete
        const stars = 5;
        setStarsEarned(stars);
        setGameResult({ success: true, msg: "Double High Five! You matched everything perfectly!" });
        onGameComplete(stars);
      }
    } else {
      // Wrong match
      setWrongMatch(true);
      setMatchStatusMsg("Not quite! Try another combination. 💡");
      setSelectedRight(null);
      setSelectedLeft(null);
    }
  };

  // --- Word Unscramble Handlers ---
  const initUnscramble = (lvlIndex: number) => {
    const list = lesson.gameData.wordUnscramble;
    if (!list || lvlIndex >= list.length) {
      // Over
      setUnscrambleStatus("completed");
      const stars = 5;
      setStarsEarned(stars);
      setGameResult({ success: true, msg: "Spelling Wizard! You successfully unscrambled all words!" });
      onGameComplete(stars);
      return;
    }

    const currentItem = list[lvlIndex];
    const word = currentItem.word.toUpperCase();
    // Shuffle characters
    let shuffled = word.split("").sort(() => Math.random() - 0.5);
    // Make sure it doesn't match the word by accident
    if (shuffled.join("") === word) {
      shuffled = word.split("").reverse();
    }
    setUnscrambleLetters(shuffled);
    setSelectedLetters([]);
    setUnscrambleFeedback("");
    setUnscrambleStatus("playing");
  };

  const handleLetterClick = (index: number) => {
    if (unscrambleStatus !== "playing") return;

    if (selectedLetters.includes(index)) {
      // Remove it
      setSelectedLetters(selectedLetters.filter((i) => i !== index));
    } else {
      // Add it
      setSelectedLetters([...selectedLetters, index]);
    }
  };

  const clearUnscramble = () => {
    if (unscrambleStatus !== "playing") return;
    setSelectedLetters([]);
  };

  const checkUnscramble = () => {
    const list = lesson.gameData.wordUnscramble;
    if (!list) return;

    const currentItem = list[unscrambleLevel];
    const targetWord = currentItem.word.toUpperCase();
    const userWord = selectedLetters.map((idx) => unscrambleLetters[idx]).join("");

    if (userWord === targetWord) {
      setUnscrambleStatus("correct");
      setUnscrambleFeedback("Whoop whoop! That is exactly right! 🌟");
    } else {
      setUnscrambleFeedback("Oops, that spelling isn't correct. Try unscrambling it again!");
    }
  };

  const nextUnscrambleWord = () => {
    const nextLvl = unscrambleLevel + 1;
    setUnscrambleLevel(nextLvl);
    initUnscramble(nextLvl);
  };

  // --- Narrative Quest Handlers ---
  const handleQuestChoice = (isCorrect: boolean, feedback: string) => {
    setQuestFeedback(feedback);
    setQuestSuccessState(isCorrect);

    if (isCorrect) {
      // Wait for user to tap next
    }
  };

  const handleNextQuestStep = () => {
    const questData = lesson.gameData.narrativeQuest;
    if (!questData) return;

    const nextStep = questStep + 1;
    if (nextStep >= questData.steps.length) {
      // Quest won
      const stars = 5;
      setStarsEarned(stars);
      setGameResult({ success: true, msg: "Master Explorer! You solved all the narrative milestones." });
      onGameComplete(stars);
    } else {
      setQuestStep(nextStep);
      setQuestFeedback("");
      setQuestSuccessState(null);
    }
  };

  return (
    <div className="bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-indigo-50 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 font-bold text-xs uppercase tracking-wider">
            Game Mode
          </span>
          <h3 className="font-bold text-lg text-gray-800">
            {lesson.gameType === "matching_cards" && "🧩 Sound-Match Matrix"}
            {lesson.gameType === "word_unscramble" && "🔤 Letter Unscramble Quest"}
            {lesson.gameType === "narrative_quest" && "🧭 Adventure Quest Simulator"}
          </h3>
        </div>
        <div className="flex items-center space-x-1 text-amber-500 font-bold bg-amber-50 px-3 py-1.5 rounded-full">
          <Star className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse" />
          <span>{starsEarned} / 5 Stars possible</span>
        </div>
      </div>

      {gameResult && (
        <div className="bg-gradient-to-br from-indigo-50 to-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center space-y-4 my-4 animate-fade-in">
          <div className="relative inline-block">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto fill-amber-50" />
            <Sparkles className="w-6 h-6 text-indigo-500 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <h4 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-amber-600 to-indigo-700 bg-clip-text text-transparent">
            Game Completed! 🏆
          </h4>
          <p className="text-gray-700 font-medium max-w-sm mx-auto">
            {gameResult.msg}
          </p>
          <div className="flex items-center justify-center space-x-2 bg-white inline-flex px-5 py-2.5 rounded-full shadow-sm border border-gray-100">
            <span className="text-indigo-600 font-bold">Earned:</span>
            <div className="flex space-x-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <span className="text-amber-600 font-extrabold ml-1">+5 Stars added to Treasure Chest!</span>
          </div>
          <div>
            <button
              onClick={resetGame}
              className="mt-2 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition duration-150 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Play Game Again</span>
            </button>
          </div>
        </div>
      )}

      {isPlaying && !gameResult && (
        <div>
          {/* ==================== A. MATCHING CARDS GAME ==================== */}
          {lesson.gameType === "matching_cards" && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-xl text-sm font-medium">
                {matchStatusMsg}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column (Terms / Cards) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Left Column</span>
                  {leftCards.map((card) => {
                    const isMatched = matchedIds.includes(card.id);
                    const isSelected = selectedLeft === card.id;
                    return (
                      <button
                        key={`left-${card.id}`}
                        disabled={isMatched}
                        onClick={() => handleLeftSelect(card.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition duration-200 text-sm ${
                          isMatched
                            ? "border-green-200 bg-green-50 text-green-700 opacity-60 pointer-events-none"
                            : isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md transform translate-x-1"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-800 font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{card.left}</span>
                          {isMatched && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right Column (Matches / Explanations) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">Right Column</span>
                  {rightCards.map((card) => {
                    const isMatched = matchedIds.includes(card.id);
                    return (
                      <button
                        key={`right-${card.id}`}
                        disabled={isMatched}
                        onClick={() => handleRightSelect(card.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition duration-200 text-sm ${
                          isMatched
                            ? "border-green-200 bg-green-50 text-green-700 opacity-60 pointer-events-none"
                            : wrongMatch
                            ? "border-red-300 bg-red-50 text-red-900 duration-100"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-800 font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{card.right}</span>
                          {isMatched && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== B. WORD UNSCRAMBLE GAME ==================== */}
          {lesson.gameType === "word_unscramble" && lesson.gameData.wordUnscramble && (
            <div className="space-y-6 py-2">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-sm font-semibold text-gray-700">
                  Word {unscrambleLevel + 1} of {lesson.gameData.wordUnscramble.length}
                </span>
                <div className="flex space-x-1">
                  {lesson.gameData.wordUnscramble.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${
                        i < unscrambleLevel
                          ? "bg-green-500"
                          : i === unscrambleLevel
                          ? "bg-indigo-600 animate-pulse"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Clue Prompt */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-amber-600 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Clue / Hint</span>
                </span>
                <p className="text-gray-800 font-medium italic bg-amber-50 p-3 rounded-xl border border-amber-200">
                  "{lesson.gameData.wordUnscramble[unscrambleLevel]?.hint}"
                </p>
              </div>

              {/* Spelled / Formulated Word */}
              <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                <span className="text-xs font-bold uppercase text-gray-400 block mb-3">Your Unscrambled Work</span>
                <div className="flex flex-wrap justify-center gap-2 min-h-12 px-4">
                  {selectedLetters.length === 0 ? (
                    <span className="text-gray-400 italic text-sm self-center">Tap bubbles below in order to spell!</span>
                  ) : (
                    selectedLetters.map((letterIdx, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 text-white font-extrabold flex items-center justify-center rounded-xl text-base md:text-xl shadow-md border-b-4 border-indigo-800 animate-pop"
                      >
                        {unscrambleLetters[letterIdx]}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Letter Bubbles Grid to select */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 block">Mixed Letter Bubbles</span>
                <div className="flex flex-wrap justify-center gap-3">
                  {unscrambleLetters.map((letter, idx) => {
                    const isUsed = selectedLetters.includes(idx);
                    return (
                      <button
                        key={idx}
                        disabled={isUsed || unscrambleStatus !== "playing"}
                        onClick={() => handleLetterClick(idx)}
                        className={`w-11 h-11 md:w-14 md:h-14 font-extrabold text-base md:text-xl flex items-center justify-center rounded-full border-2 transform active:scale-95 transition-all ${
                          isUsed
                            ? "bg-gray-100 border-gray-200 text-gray-300 opacity-40 shadow-none cursor-not-allowed"
                            : "bg-indigo-50 border-indigo-200 hover:border-indigo-500 hover:bg-white text-indigo-700 shadow-md cursor-pointer hover:-translate-y-0.5"
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                {unscrambleStatus === "playing" && (
                  <>
                    <button
                      onClick={clearUnscramble}
                      className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                      Reset Selection
                    </button>
                    <button
                      onClick={checkUnscramble}
                      disabled={selectedLetters.length === 0}
                      className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
                    >
                      Check Answer ✅
                    </button>
                  </>
                )}

                {unscrambleStatus === "correct" && (
                  <button
                    onClick={nextUnscrambleWord}
                    className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-md flex items-center justify-center space-x-2"
                  >
                    <span>Next Word</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {unscrambleFeedback && (
                <div
                  className={`mt-4 p-3 rounded-xl border text-sm text-center font-semibold ${
                    unscrambleStatus === "correct"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {unscrambleFeedback}
                </div>
              )}
            </div>
          )}

          {/* ==================== C. NARRATIVE QUEST GAME ==================== */}
          {lesson.gameType === "narrative_quest" && lesson.gameData.narrativeQuest && (
            <div className="space-y-5 py-2">
              {questStep === 0 && !questFeedback && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 mb-3">
                  <span className="text-xs font-bold uppercase text-indigo-600">Adventure Quest Start</span>
                  <p className="text-gray-800 font-medium">
                    {lesson.gameData.narrativeQuest.introduction || "Welcome to the quest! Read each scenario carefully and pick the correct decision."}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700">
                <span>Milestone {questStep + 1} of {lesson.gameData.narrativeQuest.steps.length}</span>
                <div className="flex space-x-1">
                  {lesson.gameData.narrativeQuest.steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < questStep ? "bg-green-500" : i === questStep ? "bg-orange-500 animate-pulse" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Scenario Context */}
              <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-inner space-y-2">
                <span className="text-[10px] bg-indigo-500 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Scenario Plot
                </span>
                <p className="text-sm md:text-base font-semibold leading-relaxed">
                  {lesson.gameData.narrativeQuest.steps[questStep]?.text}
                </p>
              </div>

              {/* Decision Choices */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 block">Make your choice:</span>
                {lesson.gameData.narrativeQuest.steps[questStep]?.choices.map((choice, cidx) => {
                  const isChosenAndCorrect = questSuccessState === true && questFeedback && choice.isCorrect;
                  return (
                    <button
                      key={cidx}
                      onClick={() => handleQuestChoice(choice.isCorrect, choice.feedback)}
                      disabled={questSuccessState === true}
                      className={`w-full text-left p-4 rounded-xl border-2 transition duration-150 text-sm flex items-start space-x-3 ${
                        isChosenAndCorrect
                          ? "border-green-600 bg-green-50 text-green-900 font-semibold shadow-md"
                          : questSuccessState === true
                          ? "border-gray-100 bg-gray-50 text-gray-400 opacity-60 cursor-not-allowed"
                          : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 text-gray-800"
                      }`}
                    >
                      <span className="p-1.5 bg-gray-100 rounded-lg text-xs font-extrabold text-gray-600 shrink-0">
                        {String.fromCharCode(65 + cidx)}
                      </span>
                      <span>{choice.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Choice feedback and guide */}
              {questFeedback && (
                <div
                  className={`p-4 rounded-xl border space-y-1.5 text-sm ${
                    questSuccessState === true
                      ? "bg-green-50 border-green-200 text-green-900"
                      : "bg-orange-50 border-orange-200 text-orange-900"
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold">
                    {questSuccessState === true ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                    )}
                    <span>{questSuccessState === true ? "Aha! Perfect Move!" : "Oops! Helpful Tip"}</span>
                  </div>
                  <p className="font-medium">{questFeedback}</p>
                </div>
              )}

              {/* Next quest step button */}
              {questSuccessState === true && (
                <div className="text-right">
                  <button
                    onClick={handleNextQuestStep}
                    className="inline-flex items-center space-x-2 bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-md"
                  >
                    <span>
                      {questStep + 1 === lesson.gameData.narrativeQuest.steps.length
                        ? "Finish Adventure"
                        : "Next Milestone"}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

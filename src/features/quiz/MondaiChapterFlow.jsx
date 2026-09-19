import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import mondaiChaptersData from "../../data/mondai-chapters.json";

import ChapterSelector from "../../components/ChapterSelector";
import ChapterIntro from "../../components/ChapterIntro";
import Quiz from "./Quiz";

const MondaiChapterFlow = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("selector"); // selector, intro, quiz
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterProgress, setChapterProgress] = useState({});

  // Load chapter progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem("chapterProgress");
    if (savedProgress) {
      setChapterProgress(JSON.parse(savedProgress));
    }
  }, []);

  const chapters = mondaiChaptersData.chapters;

  const handleSelectChapter = (chapter) => {
    setSelectedChapter(chapter);
    setView("intro");
  };

  const handleStartQuiz = () => {
    setView("quiz");
  };

  const handleQuizComplete = (score, totalQuestions) => {
    if (selectedChapter) {
      const newProgress = {
        ...chapterProgress,
        [selectedChapter.id]: {
          score,
          totalQuestions,
          completed: true,
          timestamp: Date.now(),
        },
      };
      setChapterProgress(newProgress);
      localStorage.setItem("chapterProgress", JSON.stringify(newProgress));
    }
    setView("selector");
    setSelectedChapter(null);
  };

  // Render Chapter Selector
  if (view === "selector") {
    return (
      <div className="min-h-screen bg-kinari-light">
        <ChapterSelector
          chapters={chapters}
          onSelectChapter={handleSelectChapter}
          currentChapterId={null}
        />
      </div>
    );
  }

  // Render Chapter Intro
  if (view === "intro" && selectedChapter) {
    return (
      <div className="min-h-screen bg-kinari-light">
        <ChapterIntro
          chapter={selectedChapter}
          onStartQuiz={handleStartQuiz}
        />
      </div>
    );
  }

  // Render Quiz
  if (view === "quiz" && selectedChapter) {
    return (
      <div className="min-h-screen bg-kinari-light">
        <Quiz
          chapter={selectedChapter}
          onComplete={handleQuizComplete}
        />
      </div>
    );
  }

  return null;
};

export default MondaiChapterFlow;

import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { AudioPlayer } from "../../components/MondaiComponents";
import { playCorrectSound, playWrongSound } from "../../utils/sfx";
import { useItemProgress } from "../progress/ProgressContext";
import { useLanguage } from "../../context/LanguageContext";

const Quiz = ({ chapter, onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const { recordAnswer } = useItemProgress();
  const { language } = useLanguage();

  const questions = chapter.questions;
  const currentQuestion = questions[currentQuestionIndex];
  const audioRef = useRef(null);

  const handlePlayAudio = () => {
    setIsPlaying(true);
  };

  const handlePauseAudio = () => {
    setIsPlaying(false);
  };

  const handleSelectOption = (index) => {
    if (isAnswered || isPlaying) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correctIndex;
    recordAnswer(currentQuestion.id, isCorrect, 15);

    if (isCorrect) {
      playCorrectSound();
      setScore((prev) => prev + 1);
    } else {
      playWrongSound();
      setWrongAnswers((prev) => [...prev, currentQuestion.id]);
    }
  };

  const handleNext = () => {
    setIsPlaying(false);
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onComplete(score, questions.length);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setSelectedOption(null);
      setIsAnswered(false);
    }
  };

  // Progress bar
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (!currentQuestion) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            Bab {chapter.chapter}: {chapter.title}
          </h2>
          <span className="text-sm font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
            Soal {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-red-600"
          />
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-[4px] border-sumi bg-kinari-light p-6 sm:p-10 shadow-[12px_12px_0_0_rgba(26,26,26,0.1)] relative"
      >
        {/* Audio Section */}
        <div className="mb-8">
          <AudioPlayer
            audioSrc={currentQuestion.audio}
            onPlay={handlePlayAudio}
            onPause={handlePauseAudio}
          />
        </div>

        {/* Question Text */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
          {currentQuestion.questionText}
        </h3>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === currentQuestion.correctIndex;
            const showResult = isAnswered;

            let buttonClass = "bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 ";
            let icon = "";

            if (showResult) {
              if (isCorrect) {
                buttonClass = "bg-green-100 border-2 border-green-500 text-green-800 ";
                icon = "✓ ";
              } else if (isSelected && !isCorrect) {
                buttonClass = "bg-red-100 border-2 border-red-500 text-red-800 ";
                icon = "✕ ";
              } else {
                buttonClass = "bg-gray-100 border-2 border-gray-200 opacity-50 ";
              }
            } else if (isSelected) {
              buttonClass = "bg-red-100 border-2 border-red-500 ";
            }

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                disabled={isAnswered || isPlaying}
                className={`
                  p-4 rounded-xl text-left font-medium transition-all
                  border-2 shadow-sm hover:shadow-md active:scale-98
                  ${buttonClass}
                `}
              >
                <span className="font-bold mr-2 text-red-600">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span>{icon}</span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <span className="font-bold text-gray-700">Penjelasan:</span>
            <p className="text-gray-600 mt-1">{currentQuestion.explanation}</p>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={`
              px-6 py-3 rounded-xl font-bold transition-all
              ${currentQuestionIndex === 0 
                ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500" 
                : "bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg active:scale-95"
              }
            `}
          >
            ← Sebelumnya
          </button>

          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className={`
              px-6 py-3 rounded-xl font-bold text-lg transition-all
              ${!isAnswered
                ? "opacity-50 cursor-not-allowed bg-gray-200 text-gray-500" 
                : "bg-red-600 text-white hover:bg-red-700 hover:shadow-xl active:scale-95"
              }
            `}
          >
            {currentQuestionIndex === questions.length - 1 
              ? "Selesai" 
              : "Selanjutnya →"
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Quiz;

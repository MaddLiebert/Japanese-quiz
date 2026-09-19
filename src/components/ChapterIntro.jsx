import React from 'react';

const ChapterIntro = ({ chapter, onStartQuiz }) => {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white border-4 border-red-600 rounded-2xl shadow-xl p-8 text-center">
        <span className="block text-5xl font-black text-red-600 mb-4">
          {chapter.chapter.toString().padStart(2, '0')}
        </span>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{chapter.title}</h2>
        
        <div className="text-left mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-2">Tujuan Belajar:</h3>
          <ul className="space-y-2">
            {chapter.objectives.map((obj, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2 mt-1 text-red-600">•</span>
                <span className="text-gray-700">{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <button
            onClick={onStartQuiz}
            className="w-full py-4 px-6 rounded-xl bg-red-600 text-white font-bold text-xl shadow-lg hover:bg-red-700 hover:shadow-xl active:scale-95 transition-all"
          >
            Mulai Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterIntro;

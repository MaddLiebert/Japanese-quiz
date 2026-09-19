import React from 'react';

const ChapterSelector = ({ chapters, onSelectChapter, currentChapterId }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Pilih Bab</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {chapters.map((chapter) => {
          const isLocked = currentChapterId && chapter.id !== currentChapterId;
          return (
            <button
              key={chapter.id}
              onClick={() => !isLocked && onSelectChapter(chapter)}
              disabled={isLocked}
              className={`
                relative group p-4 rounded-xl shadow-lg border-2 transition-all
                ${isLocked 
                  ? 'bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed' 
                  : 'bg-white border-red-600 hover:border-red-700 hover:shadow-xl active:scale-95'
                }
              `}
              aria-label={`Pilih bab ${chapter.chapter}`}
            >
              <span className="absolute top-2 right-2 flex h-3 w-3">
                {isLocked ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                )}
              </span>
              <div className="text-center">
                <span className="block text-3xl font-black text-red-600 mb-1">
                  {chapter.chapter.toString().padStart(2, '0')}
                </span>
                <span className="block text-sm font-medium text-gray-700 line-clamp-2">
                  {chapter.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterSelector;

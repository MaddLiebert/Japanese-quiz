import React from 'react';
import { motion } from 'motion/react';

export const StreakIndicator = ({ count = 0, isActive = false }) => {
  return (
    <div className="flex items-center gap-2">
      <motion.span 
        className="font-serif font-black text-3xl sm:text-4xl text-sumi leading-none"
        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        {count}
      </motion.span>
      
      <div className="relative flex items-center justify-center">
        {isActive ? (
          // Active Fire Flame - Neo-brutalist Flame SVG with pulse animation
          <motion.div
            className="relative flex items-center justify-center"
            animate={{ 
              scale: [1, 1.15, 0.95, 1.1, 1],
              rotate: [-2, 3, -3, 2, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 1.8, 
              ease: "easeInOut" 
            }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-shu border-[2.5px] border-sumi shadow-[2px_2px_0_0_#1a1a1a] flex items-center justify-center font-serif font-black text-kinari text-sm sm:text-base transform -rotate-3 select-none">
              炎
            </div>
            {/* Sparkle effects around active flame */}
            <motion.span 
              className="absolute -top-1 -right-1 w-2 h-2 bg-shu border border-sumi"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
            />
            <motion.span 
              className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-shu border border-sumi"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            />
          </motion.div>
        ) : (
          // Inactive / Cold Flame - Hanko stamp style with dormant character
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-kinari-light/60 border-[2px] border-sumi/30 border-dashed flex items-center justify-center font-serif font-bold text-sumi/40 text-sm sm:text-base select-none">
            灰
          </div>
        )}
      </div>
    </div>
  );
};

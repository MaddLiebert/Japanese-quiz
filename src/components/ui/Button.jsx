import { motion } from "motion/react";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const baseStyle = "px-6 py-3 rounded-lg font-medium tracking-wide transition-colors duration-200 text-sm sm:text-base cursor-pointer";
  
  const variants = {
    primary: "bg-ai text-white hover:bg-ai/90 shadow-sm",
    outline: "border-2 border-sumi text-sumi hover:bg-sumi hover:text-white",
    accent: "bg-shu text-white hover:bg-shu/90 shadow-sm",
  };
  
  return (
    <motion.button 
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

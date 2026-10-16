import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { PACK_RARITY, getPack } from "../packs/packs";
import { packPalette, accentInk } from "../packs/rarityStyle";
import { useLanguage } from "../../context/LanguageContext";
import { useEra } from "../theme/EraContext";
import { Glyph } from "../../components/icons/Glyph";
import { MedaruCoin } from "../../components/MedaruCoin";
import { playReelTick, playFanfare } from "../../utils/sfx";
import { CYBERPUNK_GACHA, isCyberpunk } from "./cyberpunkCopy";
import {
  CYBER_HACK_STEPS,
  CYBER_STEP_MS,
  CYBER_COMMANDS,
  SUCCESS_RATE,
  FAIL_PENALTY,
  rollResult,
  calcPenalty,
  buildCommandSequence,
  validateInput,
  simulateHack
} from "./cyberpunkHack";

const CYBER_GLOW = "0 0 22px rgba(0,240,255,.22), 0 0 46px rgba(0,240,255,.10)";
const CYBER_HOVER_GLOW = "0 0 30px rgba(0,240,255,.34), 0 0 60px rgba(0,240,255,.16)";

// ── Cyberpunk Gacha Overlay (terminal hack minigame) ─────────────────────────
function CyberpunkGachaOverlay({ pack, onClose, onArchive, userScore, userStreak, userLanguage }) {
  const [hackState, setHackState] = useState("initial"); // initial, hacking, complete, fail
  const [currentStep, setCurrentStep] = useState(0);
  const [command, setCommand] = useState("");
  const [input, setInput] = useState("");
  const [timer, setTimer] = useState(CYBER_STEP_MS[0]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [corruption, setCorruption] = useState(0);

  const commandsRef = useRef(null);
  const inputRef = useRef(null);

  // Setup commands for this session
  useEffect(() => {
    if (pack) {
      commandsRef.current = buildCommandSequence(Math.random);
      setHackState("initial");
      setCurrentStep(0);
      setInput("");
      setResult(null);
      setCorruption(0);
    }
  }, [pack]);

  // Auto-focus input when step starts
  useEffect(() => {
    if (hackState === "hacking" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStep, hackState]);

  // Timer countdown
  useEffect(() => {
    if (hackState !== "hacking") return;

    const stepMs = CYBER_STEP_MS[currentStep];
    const interval = setInterval(() => {
      setTimer((t) => {
        const newT = t - 50;
        const p = 100 - (newT / stepMs) * 100;
        setProgress(p);
        if (newT <= 0) {
          clearInterval(interval);
          handleTimeout();
        }
        return newT;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [hackState, currentStep]);

  const handleTimeout = () => {
    if (currentStep < CYBER_HACK_STEPS - 1) {
      // Failed step, continue to next (user can retry)
      setCorruption((c) => c + 10);
      setCurrentStep((s) => s + 1);
      setInput("");
    } else {
      // Final step timeout = overall fail
      finishHack(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const correct = validateInput(input, command);
    if (correct) {
      if (currentStep < CYBER_HACK_STEPS - 1) {
        // Success step
        playReelTick();
        setCurrentStep((s) => s + 1);
        setInput("");
        setTimer(CYBER_STEP_MS[currentStep + 1]);
      } else {
        // Final step success
        finishHack(true);
      }
    } else {
      // Wrong command
      setCorruption((c) => Math.min(c + 5, 100));
      setInput("");
    }
  };

  const finishHack = (success) => {
    playFanfare();
    setHackState("complete");
    
    // Calculate result
    const packRarity = getPack(pack.id)?.rarity || "common";
    const hackResult = rollResult(packRarity, Math.random);
    
    if (hackResult === "success" && success) {
      setResult({ type: "success", pack });
      setCorruption(0);
    } else {
      const penalty = calcPenalty(packRarity, userScore, userStreak);
      setResult({ type: "fail", penalty, pack });
    }
  };

  // Commands for current step
  const currentCommands = currentStep < CYBER_HACK_STEPS 
    ? commandsRef.current?.[currentStep]?.target.split(" ")[0] 
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Holographic Frame */}
      <motion.div
        className="relative w-full max-w-lg rounded-none border border-cyan/40 bg-black/80 p-6 shadow-[0_0_22px_rgba(0,240,255,0.22)]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      >
        {/* Scanline overlay */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20" style={{ 
          backgroundImage: "linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px)",
          backgroundSize: "100% 3px"
        }} />
        
        {/* Glitch effect on hover */}
        <motion.div
          className="z-10 relative"
          whileHover={{ boxShadow: CYBER_HOVER_GLOW }}
        >
          {/* Header */}
          <div className="mb-6 border-b border-cyan/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-cyan tracking-widest uppercase">
                  {CYBERPUNK_GACHA.kicker}
                </h2>
                <p className="text-cyan/80 text-sm">{CYBERPUNK_GACHA.titleSub}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan">{CYBERPUNK_GACHA.title}</div>
                <div className="text-xs text-cyan/50 uppercase">v3.2</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Target Display */}
            <div className="rounded border border-cyan/30 bg-cyan/5 p-4">
              <div className="text-xs text-cyan/60 uppercase mb-2">TARGET</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center rounded bg-cyan/10 text-cyan text-2xl">
                  <Glyph name={pack.icon} size={32} />
                </div>
                <div>
                  <div className="text-lg font-bold text-cyan">{pack.name}</div>
                  <div className="text-sm text-cyan/70">
                    {CYBERPUNK_GACHA.pull1}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {hackState === "hacking" && (
              <div>
                <div className="flex justify-between text-xs text-cyan/70 mb-1">
                  <span>PROGRESS</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full rounded bg-cyan/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-xs text-cyan/50 animate-pulse">
                    HACKING IN PROGRESS...
                  </div>
                  <div className="text-xs font-bold text-red-500">
                    ⚠ THREAT: {corruption > 80 ? "CRITICAL" : corruption > 50 ? "HIGH" : "NORMAL"}
                  </div>
                </div>
              </div>
            )}

            {/* Hack Input */}
            {hackState === "hacking" && (
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-cyan font-bold">{'>'}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="type command..."
                    className="flex-1 bg-black border-b-2 border-cyan/50 text-cyan font-mono outline-none focus:border-cyan focus:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                    autoFocus
                  />
                </div>
                {currentStep < CYBER_HACK_STEPS && (
                  <div className="text-xs text-cyan/60">
                    Step {currentStep + 1}: <span className="text-white font-bold">{command}</span>
                  </div>
                )}
              </form>
            )}

            {/* Result */}
            {hackState === "complete" && result && (
              <div className={`p-6 rounded border ${
                result.type === "success" 
                  ? "border-cyan bg-cyan/10 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                  : "border-red-500 bg-red-500/10"
              }`}>
                <div className="text-center mb-4">
                  {result.type === "success" ? (
                    <div className="text-4xl font-bold text-cyan animate-pulse">SUCCESS!</div>
                  ) : (
                    <div className="text-4xl font-bold text-red-500">FAILED</div>
                  )}
                  <div className="text-sm text-cyan/70 mt-1">
                    {CYBERPUNK_GACHA.resultTitle}
                  </div>
                </div>

                {result.type === "success" ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center rounded bg-cyan/20 text-cyan text-3xl">
                      <Glyph name={result.pack.icon} size={48} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-cyan">{result.pack.name}</div>
                      <div className="text-sm text-cyan/70">
                        {pack.rarity.toUpperCase()} — {CYBERPUNK_GACHA.toBackpack}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-center text-red-500 font-bold">
                      {result.pack.name} — DATA CORRUPTED
                    </div>
                    <div className="text-sm text-red-400 text-center">
                      Penalty: {result.penalty.score > 0 ? `${result.penalty.score}% score` : ""}{" "}
                      {result.penalty.streak > 0 ? `streak -${result.penalty.streak}` : ""}{" "}
                      {result.penalty.points < 0 ? `${result.penalty.points} pts` : ""}
                    </div>
                    <div className="text-center text-xs text-cyan/60">
                      Corruption: {corruption}%
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t border-cyan/20 pt-4">
            {hackState === "initial" && (
              <button
                onClick={() => setHackState("hacking")}
                className="px-6 py-2 rounded bg-cyan text-black font-bold uppercase tracking-wider hover:bg-cyan/80 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
              >
                {CYBERPUNK_GACHA.pull1}
              </button>
            )}
            
            {hackState === "complete" && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded border border-cyan/50 text-cyan hover:bg-cyan/10 transition-colors uppercase text-sm"
                >
                  {CYBERPUNK_GACHA.close}
                </button>
                <button
                  onClick={() => {
                    onArchive(result.pack);
                    onClose();
                  }}
                  className="px-4 py-2 rounded bg-cyan text-black font-bold uppercase tracking-wider hover:bg-cyan/80 transition-colors"
                >
                  {CYBERPUNK_GACHA.toBackpack}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded border border-cyan/50 text-cyan hover:bg-cyan/10 transition-colors uppercase text-sm"
              disabled={hackState !== "initial" && hackState !== "complete"}
            >
              {CYBERPUNK_GACHA.close}
            </button>
          </div>

          {/* Watermark */}
          <div className="absolute bottom-6 right-6 text-cyan/20 text-6xl font-bold pointer-events-none select-none opacity-30">
            電
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Hook untuk check apakah gacha Cyberpunk aktif ─────────────────────────────
export const useCyberpunkGacha = (eraId) => {
  const isCyber = isCyberpunk(eraId);
  const copy = isCyber ? CYBERPUNK_GACHA : null;
  return { isCyberpunk: isCyber, copy };
};

export { CyberpunkGachaOverlay };

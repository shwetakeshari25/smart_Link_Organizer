import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Sparkles, Coins, HelpCircle, ArrowRight, 
  CheckCircle2, AlertCircle, Loader2, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamesViewProps {
  stats: {
    xp: number;
    level: number;
    streak: number;
    coins: number;
    solvedRiddles?: string[];
  };
  onSolveRiddle: (riddleId: string, answerIndex: number) => Promise<{ success: boolean; message: string; coins?: number; xp?: number }>;
  API_BASE: string;
  isWidget?: boolean;
}

export const GamesView: React.FC<GamesViewProps> = ({ stats, onSolveRiddle, API_BASE, isWidget = false }) => {
  const [riddle, setRiddle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [resultMsg, setResultMsg] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const fetchRiddle = async () => {
    setLoading(true);
    setSelectedIdx(null);
    setResultMsg('');
    setIsCorrect(null);
    try {
      const response = await fetch(`${API_BASE}/gamification/riddle`);
      if (response.ok) {
        setRiddle(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch riddle", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiddle();
  }, []);

  const handleAnswerSubmit = async (idx: number) => {
    if (solving || isCorrect === true) return;
    setSelectedIdx(idx);
    setSolving(true);
    setResultMsg('');
    
    try {
      const result = await onSolveRiddle(riddle.id, idx);
      if (result.success) {
        setIsCorrect(true);
        setResultMsg(result.message);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        setIsCorrect(false);
        setResultMsg(result.message || "Wrong answer. Try again!");
      }
    } catch (err) {
      setResultMsg("Server communication failed.");
    } finally {
      setSolving(false);
    }
  };

  if (isWidget) {
    return (
      <div className="p-6 bg-gradient-to-tr from-[#6366F1]/10 via-[#4F46E5]/5 to-transparent border border-indigo-500/15 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="heading-font text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-indigo-600 animate-bounce" /> Riddle Master Arena
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solve riddles or video-based trivia anytime to score extra coins and level up.
            </p>
          </div>
          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-amber-600 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0">
            <span>💰 +25 Coins</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-650 animate-spin" />
            <span className="text-xs text-slate-400 font-bold tracking-wider">Summoning Next Riddle...</span>
          </div>
        ) : riddle ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                riddle.isRiddle 
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-450 border border-rose-500/20'
              }`}>
                {riddle.isRiddle ? 'Classic Riddle' : 'Video Trivia Riddle'}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-750 dark:text-slate-200">
              {riddle.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {riddle.options.map((opt: string, idx: number) => {
                const isSelected = selectedIdx === idx;
                
                let btnStyle = "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-indigo-500/40";
                
                if (isCorrect !== null) {
                  if (idx === riddle.answerIndex) {
                    btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black";
                  } else if (isSelected) {
                    btnStyle = "border-rose-500 bg-rose-500/10 text-rose-605 dark:text-rose-400 font-black";
                  } else {
                    btnStyle = "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-40";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSubmit(idx)}
                    disabled={solving || isCorrect === true}
                    className={`p-3 border rounded-xl text-xs font-bold text-left transition-all flex items-center ${btnStyle}`}
                  >
                    <span className={`inline-block w-5 h-5 text-center leading-5 bg-slate-100 dark:bg-slate-805 rounded-md mr-2.5 text-slate-500 font-black text-[10px] ${
                      isCorrect !== null && idx === riddle.answerIndex ? 'bg-emerald-500/20 text-emerald-600' : ''
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

            {resultMsg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                isCorrect 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-605 dark:text-rose-400'
              }`}>
                {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{resultMsg}</span>
              </div>
            )}

            {isCorrect === true && (
              <button
                onClick={fetchRiddle}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-md"
              >
                <span>Play Next Riddle</span> <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-450 font-bold">
            Failed to load Riddle. Please try again.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header section */}
      <div>
        <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
          <Gamepad2 className="w-7 h-7 text-indigo-600 animate-bounce" /> Riddle Master Arena
        </h1>
        <p className="text-slate-550 dark:text-slate-400 text-sm mt-0.5">
          Put your mind to the test! Solve riddles or video-based trivia anytime to score extra coins and level up.
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-tr from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider leading-none">Riddles Solved</span>
            <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block">
              {stats.solvedRiddles?.length || 0}
            </span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-tr from-yellow-500/10 to-amber-600/5 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/20 text-yellow-600 dark:text-amber-400 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider leading-none">Wallet Coins</span>
            <span className="text-lg font-black text-slate-800 dark:text-white mt-1 block">
              💰 {stats.coins || 0}
            </span>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-tr from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider leading-none">Earnings per Riddle</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              +25 Coins & XP
            </span>
          </div>
        </div>
      </div>

      {/* Main Riddle Card */}
      <div className="p-6 sm:p-8 bg-gradient-to-tr from-[#6366F1]/10 via-[#4F46E5]/5 to-transparent border border-indigo-500/15 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs text-slate-400 font-bold tracking-wider">Summoning Next Riddle...</span>
          </div>
        ) : riddle ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                riddle.isRiddle 
                  ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-450 border border-rose-500/20'
              }`}>
                {riddle.isRiddle ? '🧠 Classic Riddle' : '📺 Video-based Trivia'}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                💰 +{riddle.coinsReward} Coins
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
                <h3 className="heading-font text-base sm:text-lg font-extrabold text-slate-800 dark:text-white leading-snug">
                  {riddle.question}
                </h3>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {riddle.options.map((opt: string, idx: number) => {
                  const isSelected = selectedIdx === idx;
                  let btnStyle = "border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300";
                  
                  if (isSelected) {
                    if (isCorrect === true) {
                      btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                    } else if (isCorrect === false) {
                      btnStyle = "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400";
                    } else {
                      btnStyle = "border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSubmit(idx)}
                      disabled={solving || isCorrect === true}
                      className={`p-4 border rounded-2xl text-xs sm:text-sm font-bold text-left transition-all flex items-center cursor-pointer disabled:opacity-60 shadow-sm ${btnStyle}`}
                    >
                      <span className={`inline-block w-5.5 h-5.5 text-center leading-5 bg-slate-100 dark:bg-slate-800 rounded-lg mr-3 text-slate-500 font-black text-[10px] sm:text-xs shrink-0 ${
                        isSelected && isCorrect === true ? 'bg-emerald-500/20 text-emerald-600' : ''
                      } ${
                        isSelected && isCorrect === false ? 'bg-rose-500/20 text-rose-650' : ''
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 leading-tight">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Message & Next Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2">
                {isCorrect === true && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>{resultMsg || 'Bravo! You solved it!'}</span>
                  </div>
                )}
                {isCorrect === false && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-rose-500 font-bold">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                    <span>{resultMsg || 'That was incorrect. Try again!'}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={fetchRiddle}
                  disabled={solving}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto ${
                    isCorrect === true
                      ? 'bg-blue-600 hover:bg-blue-750 text-white shadow-blue-500/10'
                      : 'bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350'
                  }`}
                >
                  <span>{isCorrect === true ? 'Next Riddle' : 'Skip / Next Riddle'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            Failed to load Riddle. Please try refreshing.
          </div>
        )}
      </div>
    </div>
  );
};

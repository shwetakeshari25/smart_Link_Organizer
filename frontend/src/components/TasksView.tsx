import React, { useState } from 'react';
import { 
  CheckCircle, Target, Sparkles, AlertCircle, RefreshCw, Trophy
} from 'lucide-react';
import { GamesView } from './GamesView';

interface Mission {
  id: string;
  title: string;
  target: number;
  current: number;
  xpReward: number;
  coinsReward?: number;
  completed: boolean;
  claimed: boolean;
}

interface TasksViewProps {
  stats: {
    xp: number;
    level: number;
    streak: number;
    coins: number;
    dailyMissions: Mission[];
  };
  onClaimReward: (missionId: string) => Promise<void>;
  onResetMissions: () => Promise<void>;
  quiz: any;
  onSolveQuiz: (answerIndex: number) => Promise<{ success: boolean; message: string }>;
  onSolveRiddle?: (riddleId: string, answerIndex: number) => Promise<{ success: boolean; message: string; coins?: number; xp?: number }>;
  API_BASE?: string;
}

export const TasksView: React.FC<TasksViewProps> = ({ 
  stats, 
  onClaimReward, 
  onResetMissions, 
  quiz, 
  onSolveQuiz,
  onSolveRiddle,
  API_BASE
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResultMsg, setQuizResultMsg] = useState('');

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onResetMissions();
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuizSubmit = async (answerIndex: number) => {
    setSubmitting(true);
    setQuizResultMsg('');
    try {
      const result = await onSolveQuiz(answerIndex);
      setQuizResultMsg(result.message);
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = stats.dailyMissions.filter(m => m.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div>
          <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white">
            Daily Missions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Complete daily objectives to earn massive XP, earn gold coins, and maintain streaks.
          </p>
        </div>
        
        {/* Reset developer button */}
        <button 
          onClick={handleReset}
          disabled={isResetting}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          Reset Missions (Dev Mode)
        </button>
      </div>

      {/* Daily Trivia Quiz Widget */}
      {quiz && (
        <div className="p-6 bg-gradient-to-tr from-[#8B5CF6]/10 to-[#5B5FEF]/10 border border-[#8B5CF6]/20 rounded-3xl space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="heading-font text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse animate-float" /> Daily Trivia Quiz
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Answer today's learning question correctly to win extra coins!
              </p>
            </div>
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-amber-600 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0">
              <span>💰 +{quiz.coinsReward} Coins</span>
            </div>
          </div>

          {quiz.solved && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Quiz Solved!</h4>
                <p className="text-xs text-slate-500 mt-0.5">You have earned your 💰 {quiz.coinsReward} coins for today's trivia. Come back tomorrow!</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {quiz.question}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quiz.options.map((opt: string, idx: number) => {
                const isCorrect = quiz.solved && idx === quiz.answerIndex;
                let btnStyle = "border-slate-200 dark:border-slate-800/85 bg-white dark:bg-slate-900 text-slate-705 dark:text-slate-350";
                
                if (quiz.solved) {
                  if (isCorrect) {
                    btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold";
                  } else {
                    btnStyle = "border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 dark:text-slate-655 cursor-not-allowed opacity-50";
                  }
                } else {
                  btnStyle += " hover:border-[#8B5CF6]/50 dark:hover:border-[#8B5CF6]/50 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !quiz.solved && handleQuizSubmit(idx)}
                    disabled={submitting || quiz.solved}
                    className={`p-3 border rounded-xl text-xs font-bold text-left transition-all flex items-center ${btnStyle}`}
                  >
                    <span className={`inline-block w-5 h-5 text-center leading-5 bg-slate-100 dark:bg-slate-805 rounded-md mr-2.5 text-slate-500 font-extrabold text-[10px] ${
                      isCorrect ? 'bg-emerald-500/20 text-emerald-600' : ''
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
            {quizResultMsg && (
              <p className={`text-xs font-bold mt-2 ${quizResultMsg.includes('Correct') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {quizResultMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Riddle Game Section */}
      {onSolveRiddle && API_BASE && (
        <GamesView 
          stats={stats}
          onSolveRiddle={onSolveRiddle}
          API_BASE={API_BASE}
          isWidget={true}
        />
      )}

      {/* Progress Cards Banner */}
      <div className="p-6 glass-panel rounded-3xl border-slate-200/50 dark:border-slate-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="heading-font text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-500" /> Today's Completion Status
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            You've completed <span className="font-bold text-emerald-500">{completedCount}</span> of <span className="font-bold">{stats.dailyMissions.length}</span> missions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-48 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-550"
              style={{ width: `${(completedCount / stats.dailyMissions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
            {completedCount}/{stats.dailyMissions.length}
          </span>
        </div>
      </div>

      {/* Detailed Tasks List */}
      <div className="space-y-4">
        {stats.dailyMissions.map((mission, index) => {
          const progressPct = Math.min((mission.current / mission.target) * 100, 100);
          const taskColors = ['card-sky-blue', 'card-peach', 'card-mint-green', 'card-baby-pink'];
          const colorClass = taskColors[index % taskColors.length];
          
          return (
            <div 
              key={mission.id}
              className={`p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm ${colorClass}`}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {mission.completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  <h3 className="heading-font text-base font-bold text-slate-800 dark:text-white">
                    {mission.title}
                  </h3>
                </div>
                
                {/* Progress details */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-550 ${
                        mission.completed ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-650 dark:text-slate-350 min-w-[36px] text-right">
                    {mission.current} / {mission.target}
                  </span>
                </div>
              </div>

              {/* Action and Reward */}
              <div className="flex flex-row md:flex-col items-center justify-between md:justify-center md:items-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/50">
                <div className="text-left md:text-right">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">Reward</span>
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-xs font-black text-slate-800">+{mission.xpReward} XP</span>
                    <span className="text-[11px] font-extrabold text-amber-700">💰 +{mission.coinsReward || 0} Coins</span>
                  </div>
                </div>

                {mission.completed ? (
                  mission.claimed ? (
                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-550 rounded-xl text-xs font-bold block text-center min-w-[120px]">
                      Claimed
                    </span>
                  ) : (
                    <button
                      onClick={() => onClaimReward(mission.id)}
                      className="px-4.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-650 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-1 min-w-[120px] justify-center cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Claim Reward
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="px-4.5 py-2.5 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold cursor-not-allowed min-w-[120px]"
                  >
                    In Progress
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational Alerts */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Reset Schedule</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Missions refresh automatically at midnight (local time). Make sure to claim your completed mission rewards before then to get your XP and Gold Coins!
          </p>
        </div>
      </div>

    </div>
  );
};

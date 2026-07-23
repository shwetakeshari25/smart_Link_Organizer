import React, { useState } from 'react';
import { 
  Zap, Award, Flame, Plus, CheckCircle2, ChevronRight,
  TrendingUp, Library, Link as LinkIcon, AlertCircle, Sparkles
} from 'lucide-react';
import { LinkCard } from './LinkCard';
import type { LinkItem } from './LinkCard';

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

interface DashboardViewProps {
  links: LinkItem[];
  stats: {
    xp: number;
    level: number;
    streak: number;
    coins: number;
    badges: string[];
    dailyMissions: Mission[];
    xpForNextLevel: number;
  };
  onSaveLink: (url: string, tags: string[], category?: string) => Promise<void>;
  onUpdateLink: (id: string, updates: Partial<LinkItem>) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onOpenLink: (id: string) => Promise<void>;
  onClaimReward: (missionId: string) => Promise<void>;
  onNavigateToTab: (tab: string) => void;
  isLoading: boolean;
  quiz: any;
  onSolveQuiz: (answerIndex: number) => Promise<{ success: boolean; message: string }>;
  onRedeemItem: (itemId: string) => Promise<{ success: boolean; message: string }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  links,
  stats,
  onSaveLink,
  onUpdateLink,
  onDeleteLink,
  onOpenLink,
  onClaimReward,
  onNavigateToTab,
  isLoading,
  quiz,
  onSolveQuiz,
  onRedeemItem
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizMsg, setQuizMsg] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      const tags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      
      await onSaveLink(urlInput.trim(), tags, selectedCategory || undefined);
      setUrlInput('');
      setTagInput('');
      setSelectedCategory('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save link. Please check the URL.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuizSubmit = async (answerIndex: number) => {
    setSubmittingQuiz(true);
    setQuizMsg('');
    try {
      const result = await onSolveQuiz(answerIndex);
      setQuizMsg(result.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handlePurchase = async (itemId: string) => {
    setPurchasing(true);
    try {
      await onRedeemItem(itemId);
    } finally {
      setPurchasing(false);
    }
  };

  // Compute stats
  const totalLinks = links.length;
  const todaySavedLinks = links.filter(l => {
    const today = new Date().toDateString();
    return new Date(l.savedAt).toDateString() === today;
  }).length;

  const getMostUsedPlatform = () => {
    if (links.length === 0) return 'None';
    const counts: Record<string, number> = {};
    links.forEach(l => {
      counts[l.platform] = (counts[l.platform] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const getFavoriteCategory = () => {
    if (links.length === 0) return 'None';
    const counts: Record<string, number> = {};
    links.forEach(l => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  // XP Progress Percent
  const currentXpInLevel = stats.xp; 
  const xpThreshold = stats.xpForNextLevel;
  const xpPercent = Math.min(Math.floor((currentXpInLevel / xpThreshold) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Streak Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between">
        <div className="flex-1 p-6 bg-gradient-to-r from-[#6850F2] via-[#5B5FEF] to-[#59D9F8] text-white rounded-3xl flex flex-col justify-between shadow-lg">
          <div>
            <h1 className="heading-font text-2xl md:text-3xl font-extrabold text-white leading-tight flex flex-wrap items-center gap-2">
              Hello Link Organizer!
              {stats.badges.includes("Title: Link Legend") ? (
                <span className="px-2 py-0.5 text-[9px] font-black bg-amber-400 text-slate-900 rounded-full tracking-wider animate-bounce uppercase shadow-sm">
                  👑 Link Legend
                </span>
              ) : stats.badges.includes("Title: AI Explorer") ? (
                <span className="px-2 py-0.5 text-[9px] font-black bg-indigo-850 text-white rounded-full tracking-wider uppercase shadow-sm border border-indigo-700">
                  🚀 AI Explorer
                </span>
              ) : null}
            </h1>
            <p className="text-white/85 text-sm mt-1">
              Save, organize, and gamify your bookmarks. Let's make learning fun today.
            </p>
          </div>
          
          {/* XP Progress widget */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-end">
              <span className="flex items-center gap-1 text-xs font-bold text-white/95 uppercase tracking-wide">
                <Award className="w-4 h-4 text-[#42E2D0]" /> Level {stats.level}
              </span>
              <div className="flex items-center gap-3 text-xs font-bold text-white/95">
                <span className="flex items-center gap-0.5">💰 {stats.coins || 0} Coins</span>
                <span>{stats.xp} / {stats.xpForNextLevel} XP</span>
              </div>
            </div>
            <div className="w-full bg-black/15 h-3 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#6850F2] to-[#42E2D0] rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak & Level Cards */}
        <div className="grid grid-cols-2 md:w-[320px] gap-4">
          <div className="p-5 card-peach rounded-3xl flex flex-col justify-between items-center text-center shadow-lg shadow-yellow-500/5 border border-white/10">
            <div className="p-3 bg-white/30 rounded-full text-[#2E3558]">
              <Flame className="w-6 h-6 fill-current animate-pulse" />
            </div>
            <div className="mt-2">
              <span className="block text-2xl font-black text-[#2E3558] heading-font">
                {stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#2E3558]/85 tracking-wider">
                Current Streak
              </span>
            </div>
          </div>

          <div className="p-5 card-baby-pink rounded-3xl flex flex-col justify-between items-center text-center shadow-lg shadow-pink-500/5 border border-white/10">
            <div className="p-3 bg-white/30 rounded-full text-[#2E3558]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div className="mt-2">
              <span className="block text-2xl font-black text-[#2E3558] heading-font">
                {stats.xp}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#2E3558]/85 tracking-wider">
                Total XP Earned
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Link Quick-Bar */}
      <div className="p-6 dashboard-add-link rounded-3xl shadow-lg glow-primary/5">
        <h2 className="heading-font text-lg font-bold text-[#2E3558] mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-[#6850F2]" /> Save a New Link
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste any link here (e.g. https://github.com/...)"
              required
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-slate-400"
            />
            <button 
              type="submit"
              disabled={isSaving || !urlInput}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none cursor-pointer"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Save Link
                </>
              )}
            </button>
          </div>
          
          <div className="flex flex-wrap md:flex-nowrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <input 
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Tags (comma-separated, e.g. React, DSA, Web)"
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            
            <div className="w-full md:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 text-slate-650 dark:text-slate-350 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">Auto-Detect Category</option>
                <option value="YouTube">📺 YouTube</option>
                <option value="GitHub">💻 GitHub</option>
                <option value="LinkedIn">💼 LinkedIn</option>
                <option value="Instagram">📸 Instagram</option>
                <option value="Twitter/X">🐦 Twitter/X</option>
                <option value="Reddit">🤖 Reddit</option>
                <option value="Medium">✍️ Medium</option>
                <option value="Dev.to">🛠️ Dev.to</option>
                <option value="Personal Website">🌐 Personal Website</option>
                <option value="Other">🔗 Other</option>
              </select>
            </div>
          </div>
          
          {errorMessage && (
            <div className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1.5 mt-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>
      </div>

      {/* Daily Trivia Challenge (Quiz Widget) */}
      {quiz && (
        <div className="p-6 bg-gradient-to-tr from-[#8B5CF6]/15 via-[#5B5FEF]/10 to-[#59D9F8]/10 border border-[#8B5CF6]/20 rounded-3xl space-y-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="heading-font text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Daily Trivia Challenge
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete today's coding or organizing question to earn gold coins!
              </p>
            </div>
            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/25 text-amber-600 rounded-full text-xs font-black flex items-center gap-1 shadow-sm shrink-0">
              <span>💰 +{quiz.coinsReward} Coins</span>
            </div>
          </div>

          {quiz.solved ? (
            <div className="p-4 bg-emerald-550/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Daily Challenge Completed!</h4>
                <p className="text-xs text-slate-550 mt-0.5">You solved today's trivia challenge and pocketed your 💰 {quiz.coinsReward} coins reward. Keep it up!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-750 dark:text-slate-200">
                {quiz.question}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quiz.options.map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleQuizSubmit(idx)}
                    disabled={submittingQuiz}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-[#8B5CF6]/50 dark:hover:border-[#8B5CF6]/50 rounded-xl text-xs font-bold text-slate-705 dark:text-slate-350 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer disabled:opacity-50 flex items-center"
                  >
                    <span className="inline-block w-5 h-5 text-center leading-5 bg-slate-100 dark:bg-slate-805 rounded-md mr-2.5 text-slate-500 font-extrabold text-[10px]">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                ))}
              </div>
              {quizMsg && (
                <p className={`text-xs font-bold mt-2 ${quizMsg.includes('Correct') ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {quizMsg}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid of Daily Missions and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Missions */}
        <div className="lg:col-span-2 p-6 dashboard-missions rounded-3xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="heading-font text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Daily Missions
            </h2>
            <button 
              onClick={() => onNavigateToTab('tasks')}
              className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
            >
              All Tasks <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {stats.dailyMissions.map((mission) => {
              const progressPct = Math.min((mission.current / mission.target) * 100, 100);
              return (
                <div 
                  key={mission.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    mission.completed 
                      ? 'bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-950/5' 
                      : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/40 dark:border-slate-800/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        {mission.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                        Reward: +{mission.xpReward} XP | 💰 +{mission.coinsReward || 0} Coins
                      </span>
                    </div>
                    {mission.completed ? (
                      mission.claimed ? (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Claimed
                        </span>
                      ) : (
                        <button
                          onClick={() => onClaimReward(mission.id)}
                          className="text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          Claim Reward
                        </button>
                      )
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-450">
                        {mission.current} / {mission.target}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        mission.completed ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="p-6 dashboard-quick-stats rounded-3xl flex flex-col justify-between shadow-lg">
          <div>
            <h2 className="heading-font text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Quick Stats
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-2xl card-sky-blue shadow-sm">
                <span className="text-xs font-bold text-[#2E3558]/90">Total Links</span>
                <span className="text-sm font-black heading-font text-[#2E3558]">{totalLinks}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-2xl card-soft-purple shadow-sm">
                <span className="text-xs font-bold text-white/95">Saved Today</span>
                <span className="text-sm font-black heading-font text-white">{todaySavedLinks}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 rounded-2xl card-peach shadow-sm">
                <span className="text-xs font-bold text-[#2E3558]/90">Top Platform</span>
                <span className="text-xs font-black bg-white/50 px-2 py-0.5 rounded text-right truncate max-w-[130px] text-[#2E3558]">{getMostUsedPlatform()}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-2xl card-mint-green shadow-sm">
                <span className="text-xs font-bold text-[#2E3558]/90">Favorite Category</span>
                <span className="text-xs font-black bg-white/50 px-2 py-0.5 rounded text-right truncate max-w-[130px] text-[#2E3558]">{getFavoriteCategory()}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigateToTab('analytics')}
            className="w-full mt-6 py-3 border border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-350 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            View Full Analytics <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Coins Redemption Shop Widget */}
      <div className="p-6 bg-gradient-to-tr from-[#FF6584]/5 via-[#FBBF24]/5 to-[#42E2D0]/5 border border-slate-200/50 dark:border-slate-800/25 rounded-3xl space-y-4 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="heading-font text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" /> Coins Redemption Shop
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Redeem your hard-earned gold coins to unlock exclusive profile titles!
            </p>
          </div>
          <div className="px-3.5 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-amber-600 rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm shrink-0">
            <span>Your Balance: 💰 {stats.coins || 0} Coins</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Title: AI Explorer */}
          <div className="p-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200/55 dark:border-slate-800/35 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                Profile Title
              </span>
              <h4 className="text-sm font-black text-slate-850 dark:text-white mt-1">
                "AI Explorer"
              </h4>
              <p className="text-[11px] text-slate-500">
                Flaunt your tech prowess. Unlocks a custom title tag next to your name.
              </p>
            </div>
            <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800/40 pt-2 shrink-0">
              <span className="text-xs font-extrabold text-amber-600">💰 50 Coins</span>
              {stats.badges.includes("Title: AI Explorer") ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black">
                  Unlocked
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase("title_ai")}
                  disabled={purchasing || (stats.coins || 0) < 50}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Unlock
                </button>
              )}
            </div>
          </div>

          {/* Title: Link Legend */}
          <div className="p-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200/55 dark:border-slate-800/35 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                Elite Title
              </span>
              <h4 className="text-sm font-black text-slate-855 dark:text-white mt-1">
                "Link Legend"
              </h4>
              <p className="text-[11px] text-slate-500">
                Showcase your dedication. Unlocks the prestigious legend badge tag.
              </p>
            </div>
            <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800/40 pt-2 shrink-0">
              <span className="text-xs font-extrabold text-amber-600">💰 100 Coins</span>
              {stats.badges.includes("Title: Link Legend") ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black">
                  Unlocked
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase("title_legend")}
                  disabled={purchasing || (stats.coins || 0) < 100}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Unlock
                </button>
              )}
            </div>
          </div>

          {/* Theme Card Glow */}
          <div className="p-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200/55 dark:border-slate-800/35 rounded-2xl flex flex-col justify-between gap-3 relative overflow-hidden group">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                Cosmetics
              </span>
              <h4 className="text-sm font-black text-slate-855 dark:text-white mt-1">
                Gold Card Glow
              </h4>
              <p className="text-[11px] text-slate-500">
                Apply a beautiful gold border glow theme to your saved links list cards.
              </p>
            </div>
            <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800/40 pt-2 shrink-0">
              <span className="text-xs font-extrabold text-amber-600">💰 75 Coins</span>
              {stats.badges.includes("Theme: Gold Card Glow") ? (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black">
                  Active
                </span>
              ) : (
                <button
                  onClick={() => handlePurchase("theme_gold")}
                  disabled={purchasing || (stats.coins || 0) < 75}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  Unlock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Links Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="heading-font text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-500" /> Recent Links
          </h2>
          <button 
            onClick={() => onNavigateToTab('categories')}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5 font-semibold"
          >
            All Links <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="glass-card rounded-2xl h-80 animate-pulse bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/30" />
            ))}
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 glass-panel rounded-3xl text-center border-slate-200/50 dark:border-slate-800/30">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
              <LinkIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white heading-font">No saved links yet</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Paste a URL in the box above to automatically detect its platform, grab metadata, and start gaining XP!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {links.slice(0, 4).map((link) => (
              <LinkCard 
                key={link._id} 
                link={link} 
                onUpdate={onUpdateLink} 
                onDelete={onDeleteLink}
                onOpen={onOpenLink}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Trophy, Award, Zap, Flame, Sparkles, Lock, Target
} from 'lucide-react';

interface AchievementsViewProps {
  stats: {
    xp: number;
    level: number;
    streak: number;
    badges: string[];
    xpForNextLevel: number;
  };
  totalLinksCount: number;
  completedLinksCount: number;
}

interface BadgeDetails {
  id: string;
  name: string;
  description: string;
  condition: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ stats, totalLinksCount, completedLinksCount }) => {
  
  const allBadges: BadgeDetails[] = [
    {
      id: 'first_link',
      name: 'First Link',
      description: 'Saved your very first link! The journey begins.',
      condition: 'Save 1 link',
      icon: <Award className="w-8 h-8" />,
      color: 'text-blue-500 border-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'learning_master',
      name: 'Learning Master',
      description: 'Completed 3 links of educational content (YouTube, Medium, etc.).',
      condition: 'Mark 3 links as "Completed"',
      icon: <Trophy className="w-8 h-8" />,
      color: 'text-teal-500 border-teal-400',
      bgColor: 'bg-teal-500/10'
    },
    {
      id: 'consistency_king',
      name: 'Consistency King',
      description: 'Maintained your organizing streak for 5 days.',
      condition: 'Reach a streak of 🔥 5 days',
      icon: <Flame className="w-8 h-8" />,
      color: 'text-amber-500 border-amber-400',
      bgColor: 'bg-amber-500/10'
    },
    {
      id: 'power_user',
      name: 'Power User',
      description: 'Level up your dashboard and reach Level 3.',
      condition: 'Reach Level 3',
      icon: <Zap className="w-8 h-8" />,
      color: 'text-purple-500 border-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'productivity_hero',
      name: 'Productivity Hero',
      description: 'Claimed a reward for completing a daily mission.',
      condition: 'Complete a Daily Mission',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'text-rose-500 border-rose-400',
      bgColor: 'bg-rose-500/10'
    }
  ];

  // XP progress percent
  const xpThreshold = stats.xpForNextLevel;
  const xpPercent = Math.min(Math.floor((stats.xp / xpThreshold) * 100), 100);

  return (
    <div className="space-y-6">
      <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white">
        Achievements & Badges
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm -mt-4">
        Earn XP, level up, and unlock exclusive digital badges as you organize your links.
      </p>

      {/* Big Level showcase */}
      <div className="p-6 glass-panel rounded-3xl border-slate-200/50 dark:border-slate-800/30 flex flex-col md:flex-row items-center gap-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex flex-col items-center justify-center text-white border-4 border-white/20 shadow-lg shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100 leading-none">Level</span>
          <span className="text-4xl font-black heading-font mt-0.5 leading-none">{stats.level}</span>
        </div>
        
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h3 className="heading-font text-lg font-bold text-slate-800 dark:text-white">XP Level Progress</h3>
            <p className="text-xs text-slate-550">
              Unlock the next level at <span className="font-bold text-blue-500">{stats.xpForNextLevel} XP</span>. Current Level: {stats.level}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Total Links Organized: <span className="font-bold text-blue-500">{totalLinksCount}</span> | Completed: <span className="font-bold text-emerald-500">{completedLinksCount}</span>
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200/10 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              <span>{stats.xp} XP</span>
              <span>{stats.xpForNextLevel} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h2 className="heading-font text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Unlocked Badges ({stats.badges.length} / {allBadges.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBadges.map((badge, index) => {
            const isUnlocked = stats.badges.includes(badge.name);
            const badgeColors = ['card-sky-blue', 'card-peach', 'card-mint-green', 'card-baby-pink', 'card-soft-purple'];
            const colorClass = isUnlocked ? badgeColors[index % badgeColors.length] : 'bg-slate-100/50 dark:bg-slate-900/10 border-slate-250/20 opacity-55';
            
            return (
              <div 
                key={badge.id}
                className={`p-5 rounded-3xl border flex gap-4 items-start transition-all relative overflow-hidden ${colorClass}`}
              >
                {/* Badge Icon */}
                <div className={`p-3.5 rounded-2xl border shrink-0 ${
                  isUnlocked 
                    ? `${badge.bgColor} ${badge.color}` 
                    : 'bg-slate-100 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800'
                }`}>
                  {isUnlocked ? badge.icon : <Lock className="w-8 h-8 text-slate-400" />}
                </div>

                <div className="space-y-1">
                  <h3 className="heading-font text-sm font-bold text-slate-800 dark:text-white">
                    {badge.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-normal">
                    {badge.description}
                  </p>
                  
                  {/* Progress/Condition */}
                  <div className="pt-1.5">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isUnlocked 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {isUnlocked ? 'Unlocked' : `Requires: ${badge.condition}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gamification Rulebook */}
      <div className="p-6 glass-panel rounded-3xl border-slate-200/50 dark:border-slate-800/30">
        <h3 className="heading-font text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-1.5">
          <Target className="w-5 h-5 text-indigo-500" /> XP Rules Sheet
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-3 card-sky-blue rounded-2xl shadow-sm">
            <span className="block text-lg font-black text-[#2E3558] heading-font">+10 XP</span>
            <span className="text-[10px] text-[#2E3558]/85 font-extrabold uppercase tracking-wider">Save a Link</span>
          </div>

          <div className="p-3 card-mint-green rounded-2xl shadow-sm">
            <span className="block text-lg font-black text-[#2E3558] heading-font">+20 XP</span>
            <span className="text-[10px] text-[#2E3558]/85 font-extrabold uppercase tracking-wider">Complete Link</span>
          </div>

          <div className="p-3 card-soft-purple rounded-2xl shadow-sm">
            <span className="block text-lg font-black text-white heading-font">+5 XP</span>
            <span className="text-[10px] text-white/90 font-extrabold uppercase tracking-wider">Add a Tag</span>
          </div>

          <div className="p-3 card-baby-pink rounded-2xl shadow-sm">
            <span className="block text-lg font-black text-[#2E3558] heading-font">+2 XP</span>
            <span className="text-[10px] text-[#2E3558]/85 font-extrabold uppercase tracking-wider">Favorite Link</span>
          </div>
        </div>
      </div>
      
    </div>
  );
};

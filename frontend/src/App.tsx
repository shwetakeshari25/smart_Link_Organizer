import { useState, useEffect } from 'react';
import { 
  Home, Folder, Star, Trophy, CheckSquare, BarChart2, Settings, 
  Sun, Moon, Bell, Search, Flame, Award, Menu, X, Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Import Views
import { DashboardView } from './components/DashboardView';
import { CategoriesView } from './components/CategoriesView';
import { AnalyticsView } from './components/AnalyticsView';
import { AchievementsView } from './components/AchievementsView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';
import { LinkCard } from './components/LinkCard';
import type { LinkItem } from './components/LinkCard';

const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api' 
  : 'https://smart-link-organizer-cejc.onrender.com/api';

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'favorites' | 'achievements' | 'tasks' | 'analytics' | 'settings'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    xp: 0,
    level: 1,
    streak: 0,
    coins: 0,
    dailyQuizSolved: false,
    badges: [],
    dailyMissions: [],
    xpForNextLevel: 100
  });
  const [quiz, setQuiz] = useState<any>(null);

  // Load Theme on Init
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [linksRes, catsRes, colsRes, statsRes, notifRes, quizRes] = await Promise.all([
        fetch(`${API_BASE}/links`),
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/collections`),
        fetch(`${API_BASE}/gamification`),
        fetch(`${API_BASE}/notifications`),
        fetch(`${API_BASE}/gamification/quiz`)
      ]);

      if (linksRes.ok) setLinks(await linksRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (colsRes.ok) setCollections(await colsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (quizRes.ok) setQuiz(await quizRes.json());
    } catch (error) {
      console.error('Failed to connect to backend api:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh notifications and stats on action
  const refreshStatsAndNotifications = async () => {
    try {
      const [statsRes, notifRes, quizRes] = await Promise.all([
        fetch(`${API_BASE}/gamification`),
        fetch(`${API_BASE}/notifications`),
        fetch(`${API_BASE}/gamification/quiz`)
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (quizRes.ok) setQuiz(await quizRes.json());
    } catch (e) {
      console.error('Stats reload error', e);
    }
  };

  // Keyboard Shortcuts alt + keyboard keys
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setActiveTab('dashboard');
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          setActiveTab('categories');
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setActiveTab('analytics');
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          setActiveTab('settings');
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setActiveTab('dashboard');
          // Delay to let React render and focus the input element
          setTimeout(() => {
            const el = document.querySelector('input[type="url"]') as HTMLInputElement;
            el?.focus();
          }, 100);
        }
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, []);

  // Handlers

  // Quiz and Shop Handlers
  const handleSolveQuiz = async (answerIndex: number) => {
    try {
      const response = await fetch(`${API_BASE}/gamification/quiz/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIndex })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
          setStats((prev: any) => ({
            ...prev,
            coins: result.coins,
            dailyQuizSolved: true
          }));
          setQuiz((prev: any) => ({
            ...prev,
            solved: true,
            answerIndex: result.answerIndex
          }));
          return { success: true, message: result.message };
        } else {
          return { success: false, message: result.message };
        }
      }
      return { success: false, message: 'Failed to submit answer' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Server error' };
    }
  };



  const handleRedeemItem = async (itemId: string) => {
    try {
      const response = await fetch(`${API_BASE}/gamification/shop/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStats((prev: any) => ({
          ...prev,
          coins: result.coins,
          badges: result.badges
        }));
        confetti({ particleCount: 80, spread: 50 });
        alert(result.message);
        return { success: true, message: result.message };
      } else {
        alert(result.error || 'Failed to redeem item');
        return { success: false, message: result.error || 'Failed' };
      }
    } catch (e) {
      console.error(e);
      alert('Redemption failed due to server connection issue');
      return { success: false, message: 'Connection error' };
    }
  };

  const handleSolveRiddle = async (riddleId: string, answerIndex: number) => {
    try {
      const response = await fetch(`${API_BASE}/gamification/riddle/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riddleId, answerIndex })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setStats((prev: any) => ({
          ...prev,
          coins: result.coins,
          xp: result.xp,
          level: result.level,
          solvedRiddles: result.gamification?.solvedRiddles || prev.solvedRiddles
        }));
        handleLevelUpCheck(result.gamification);
        refreshStatsAndNotifications();
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || result.error || 'Incorrect answer' };
      }
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Server error' };
    }
  };

  const handleSolveVideoQuiz = async (linkId: string, answerIndex: number) => {
    try {
      const response = await fetch(`${API_BASE}/links/${linkId}/quiz/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerIndex })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setLinks(prev => prev.map(item => item._id === linkId ? result.link : item));
        setStats((prev: any) => ({
          ...prev,
          coins: result.coins,
          xp: result.xp,
          level: result.level
        }));
        handleLevelUpCheck(result.gamification);
        refreshStatsAndNotifications();
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.message || result.error || 'Incorrect answer' };
      }
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Server error' };
    }
  };

  // Theme Toggle
  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Level Up Confetti Trigger
  const handleLevelUpCheck = (gamificationData: any) => {
    if (gamificationData && gamificationData.levelUp) {
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // Links API Handlers
  const handleSaveLink = async (url: string, tags: string[], category?: string) => {
    const response = await fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, category, tags })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save link');
    }
    
    const result = await response.json();
    setLinks(prev => [result.link, ...prev]);
    
    handleLevelUpCheck(result.gamification);
    refreshStatsAndNotifications();
  };

  const handleUpdateLink = async (id: string, updates: Partial<LinkItem>) => {
    const response = await fetch(`${API_BASE}/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (response.ok) {
      const result = await response.json();
      setLinks(prev => prev.map(item => item._id === id ? result.link : item));
      handleLevelUpCheck(result.gamification);
      refreshStatsAndNotifications();
    }
  };

  const handleOpenLink = async (id: string) => {
    const response = await fetch(`${API_BASE}/links/${id}/open`, {
      method: 'POST'
    });
    if (response.ok) {
      const result = await response.json();
      setLinks(prev => prev.map(item => item._id === id ? result.link : item));
      refreshStatsAndNotifications();
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this saved link?')) {
      const response = await fetch(`${API_BASE}/links/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLinks(prev => prev.filter(item => item._id !== id));
        refreshStatsAndNotifications();
      }
    }
  };

  // Claim Reward Handler
  const handleClaimReward = async (missionId: string) => {
    const response = await fetch(`${API_BASE}/gamification/claim/${missionId}`, {
      method: 'POST'
    });
    if (response.ok) {
      const result = await response.json();
      handleLevelUpCheck(result);
      refreshStatsAndNotifications();
    }
  };

  const handleResetMissions = async () => {
    const response = await fetch(`${API_BASE}/gamification/reset-missions`, {
      method: 'POST'
    });
    if (response.ok) {
      const result = await response.json();
      setStats(result.stats);
      refreshStatsAndNotifications();
    }
  };

  // Categories API Handlers
  const handleRenameCategory = async (id: string, name: string, icon: string) => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon })
    });
    if (response.ok) {
      // Reload links and categories to sync names
      const linksRes = await fetch(`${API_BASE}/links`);
      const catsRes = await fetch(`${API_BASE}/categories`);
      if (linksRes.ok) setLinks(await linksRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      refreshStatsAndNotifications();
    }
  };

  // Collections API Handlers
  const handleCreateCollection = async (name: string, description: string) => {
    const response = await fetch(`${API_BASE}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (response.ok) {
      const colsRes = await fetch(`${API_BASE}/collections`);
      if (colsRes.ok) setCollections(await colsRes.json());
    }
  };

  const handleDeleteCollection = async (id: string) => {
    const response = await fetch(`${API_BASE}/collections/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setCollections(prev => prev.filter(c => c.id !== id));
    }
  };

  // Import Backup data
  const handleImportBackupData = async (importedLinks: any[]) => {
    // Loop and POST import. Let's send them to server. To make it quick, we send in sequence.
    for (let link of importedLinks) {
      try {
        await fetch(`${API_BASE}/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: link.url,
            category: link.category,
            tags: link.tags,
            notes: link.notes
          })
        });
      } catch (e) {
        console.error('Import item failed', link.url, e);
      }
    }
    await fetchData();
  };

  // Reset Account Data
  const handleClearAllData = async () => {
    // Re-create default database setup. Clean files.
    // Call custom server route or iterate delete. We can perform custom deletes.
    for (let link of links) {
      await fetch(`${API_BASE}/links/${link._id}`, { method: 'DELETE' });
    }
    // Delete custom collections
    for (let col of collections) {
      await fetch(`${API_BASE}/collections/${col.id}`, { method: 'DELETE' });
    }
    // Reset missions
    await handleResetMissions();
    
    // Set XP to 0
    await fetch(`${API_BASE}/gamification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xp: 0, level: 1, streak: 0, badges: [] })
    });

    await fetchData();
  };

  // Sidebar Items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <Folder className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-5 h-5" /> },
    { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-5 h-5" /> },
    { id: 'tasks', label: 'Daily Tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ] as const;

  // Filter links for Search Queries / Favorite View
  const getFilteredLinks = () => {
    let list = [...links];
    if (activeTab === 'favorites') {
      list = list.filter(l => l.favorite);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => 
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.domain && l.domain.toLowerCase().includes(q)) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return list;
  };

  const filteredLinks = getFilteredLinks();

  return (
    <div className="min-h-screen flex text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#0B0F19]">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-40 w-64 sidebar-navy flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 space-y-6">
          {/* Logo */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl text-white font-black text-sm shadow-md">
                SLO
              </span>
              <div>
                <span className="font-extrabold heading-font text-sm block tracking-tight leading-none text-slate-800 dark:text-white">
                  Smart Link
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                  Organizer
                </span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false); // Close on mobile navigation
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User XP Widget in Sidebar */}
        <div className="p-5 border-t border-slate-200/50 dark:border-slate-800/20">
          <div className="p-4 bg-gradient-to-tr from-[#6850F2]/10 to-[#34BEA9]/10 rounded-2xl border border-[#6850F2]/10 flex items-center gap-3">
            <div className="p-2 bg-[#6850F2]/10 rounded-xl text-[#6850F2] shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-black text-slate-800 dark:text-white leading-tight">Level {stats.level}</span>
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                <span>{stats.xp} XP</span>
                <span className="text-amber-600 flex items-center gap-0.5">💰 {stats.coins || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN LAYOUT WINDOW */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER SECTION */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 glass-panel border-b border-slate-250/20">
          
          {/* Left: Mobile Sidebar Open and Search */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Input */}
            <div className="relative max-w-sm w-full hidden md:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search globally by keyword, domain, platform, tags..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors placeholder-slate-400"
              />
            </div>
          </div>

          {/* Right: Gamification stats, Notifications dropdown and Theme toggle */}
          <div className="flex items-center gap-3">
            
            {/* Coins Widget */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-amber-600 text-xs font-bold" title="Your Coins balance">
              <Coins className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>💰 {stats.coins || 0}</span>
            </div>

            {/* Streaks Widget */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/10 text-amber-500 text-xs font-bold">
              <Flame className="w-4 h-4 fill-current animate-pulse" />
              <span>🔥 {stats.streak}</span>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={handleThemeToggle}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-650 dark:text-slate-350 transition-colors cursor-pointer"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            {/* Notifications Panel */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-650 dark:text-slate-350 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0B0F19]" />
                )}
              </button>

              {/* Notification list overlay */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3.5 w-80 glass-panel rounded-3xl border-slate-250/20 p-4 shadow-2xl z-50 animate-scale-up">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-white heading-font">Notifications</span>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[10px] text-slate-400 hover:text-slate-500 font-bold"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No notifications or reminders. You're all caught up!
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-start gap-2.5">
                          <span className="text-lg mt-0.5">{n.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">{n.title}</h4>
                            <p className="text-[10px] text-slate-450 mt-0.5 leading-snug">{n.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MAIN DISPLAY VIEW WINDOW */}
        <main className="flex-1 p-6 overflow-y-auto max-w-[1400px] w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-450 font-bold tracking-wider">Syncing Organizer Data...</span>
            </div>
          ) : (
            <>
              {/* Tab Renderer */}
              {activeTab === 'dashboard' && (
                <DashboardView 
                  links={links}
                  stats={stats}
                  onSaveLink={handleSaveLink}
                  onUpdateLink={handleUpdateLink}
                  onDeleteLink={handleDeleteLink}
                  onOpenLink={handleOpenLink}
                  onClaimReward={handleClaimReward}
                  onNavigateToTab={(tab: any) => setActiveTab(tab)}
                  isLoading={isLoading}
                  quiz={quiz}
                  onSolveQuiz={handleSolveQuiz}
                  onRedeemItem={handleRedeemItem}
                  onSolveRiddle={handleSolveRiddle}
                  onSolveVideoQuiz={handleSolveVideoQuiz}
                  API_BASE={API_BASE}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesView 
                  links={links}
                  categories={categories}
                  collections={collections}
                  onRenameCategory={handleRenameCategory}
                  onCreateCollection={handleCreateCollection}
                  onDeleteCollection={handleDeleteCollection}
                  onUpdateLink={handleUpdateLink}
                  onDeleteLink={handleDeleteLink}
                  onOpenLink={handleOpenLink}
                  stats={stats}
                  onSolveVideoQuiz={handleSolveVideoQuiz}
                />
              )}

              {activeTab === 'favorites' && (
                <div className="space-y-6">
                  <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Star className="w-6 h-6 text-rose-500 fill-current" /> Favorite Links
                  </h1>
                  <p className="text-slate-550 text-sm -mt-4">
                    Your key bookmarked pages that you marked with a ⭐ for quick retrieval.
                  </p>

                  {filteredLinks.length === 0 ? (
                    <div className="p-16 bg-gradient-to-br from-[#FAF6FA] to-[#F58FA8]/15 border border-[#F58FA8]/30 rounded-3xl text-center shadow-lg">
                      <Star className="w-12 h-12 text-[#F58FA8] fill-current mx-auto mb-3 animate-pulse" />
                      <h3 className="text-base font-bold text-[#2E3558] heading-font">No favorites saved</h3>
                      <p className="text-xs text-[#64748B] mt-1">
                        Go to your Dashboard or Categories and click the heart icon on any preview card to add it here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredLinks.map((link) => (
                        <LinkCard 
                          key={link._id} 
                          link={link} 
                          onUpdate={handleUpdateLink} 
                          onDelete={handleDeleteLink}
                          onOpen={handleOpenLink}
                          hasGoldTheme={stats?.badges?.includes("Theme: Gold Card Glow")}
                          onSolveVideoQuiz={handleSolveVideoQuiz}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'achievements' && (
                <AchievementsView 
                  stats={stats}
                  totalLinksCount={links.length}
                  completedLinksCount={links.filter(l => l.progress === 'Completed').length}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksView 
                  stats={stats}
                  onClaimReward={handleClaimReward}
                  onResetMissions={handleResetMissions}
                  quiz={quiz}
                  onSolveQuiz={handleSolveQuiz}
                  onSolveRiddle={handleSolveRiddle}
                  API_BASE={API_BASE}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView links={links} />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  theme={theme}
                  onThemeToggle={handleThemeToggle}
                  links={links}
                  stats={stats}
                  onImportData={handleImportBackupData}
                  onClearAllData={handleClearAllData}
                />
              )}
            </>
          )}
        </main>
        
      </div>
    </div>
  );
}

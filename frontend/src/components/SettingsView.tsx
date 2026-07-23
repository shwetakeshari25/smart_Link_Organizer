import React, { useRef, useState } from 'react';
import { 
  Download, Upload, Trash2, Sun, Moon,
  Keyboard, Info, AlertTriangle, ShieldCheck
} from 'lucide-react';
import type { LinkItem } from './LinkCard';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  links: LinkItem[];
  stats: any;
  onImportData: (links: any[]) => Promise<void>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeToggle,
  links,
  stats,
  onImportData,
  onClearAllData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  const [isWiping, setIsWiping] = useState(false);

  // Export data as JSON file
  const handleExportData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ links, stats }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `smart_organizer_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      alert('Failed to export data: ' + e.message);
    }
  };

  // Import data from JSON file
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        let importedLinks = [];
        if (Array.isArray(json)) {
          importedLinks = json;
        } else if (json && Array.isArray(json.links)) {
          importedLinks = json.links;
        } else {
          throw new Error("Invalid backup format. Must contain a links array.");
        }

        if (importedLinks.length === 0) {
          throw new Error("No links found in file.");
        }

        await onImportData(importedLinks);
        setImportStatus({ type: 'success', message: `Successfully imported ${importedLinks.length} links!` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setImportStatus({ type: 'error', message: 'Import failed: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  const handleWipeData = async () => {
    if (window.confirm('⚠️ WARNING: This will permanently delete all your links, tags, custom folders, XP, levels, and badges. This cannot be undone! Are you absolutely sure you want to reset everything?')) {
      setIsWiping(true);
      try {
        await onClearAllData();
        alert('All data has been reset to default.');
      } finally {
        setIsWiping(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white">
        Application Settings
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm -mt-4">
        Customize interface preferences, manage backups, and review guides.
      </p>

      {/* Theme preferences */}
      <div className="p-6 bg-gradient-to-br from-[#FAF6FA] to-[#C8B6FF]/15 border border-[#C8B6FF]/35 rounded-3xl space-y-4 shadow-sm">
        <h3 className="heading-font text-base font-bold text-[#2E3558] flex items-center gap-2">
          {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />} Theme Preferences
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-350">Dark / Light Mode Toggle</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Toggle visual interface lighting</span>
          </div>
          
          <button 
            onClick={onThemeToggle}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4" /> Toggle Dark Mode
              </>
            ) : (
              <>
                <Sun className="w-4 h-4" /> Toggle Light Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backup and restore */}
      <div className="p-6 bg-gradient-to-br from-[#FAF6FA] to-[#49C6F8]/15 border border-[#49C6F8]/35 rounded-3xl space-y-4 shadow-sm">
        <h3 className="heading-font text-base font-bold text-[#2E3558] flex items-center gap-2">
          <Download className="w-5 h-5 text-[#6850F2]" /> Backup & Import Data
        </h3>
        <p className="text-xs text-slate-500 leading-normal">
          Save your database backups locally as standard JSON files or import previously exported collections.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          {/* Export button */}
          <button 
            onClick={handleExportData}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Backup
          </button>
          
          {/* Import button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={handleImportClick}
            className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-2xl text-xs font-bold text-slate-750 dark:text-slate-350 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import Backup
          </button>
        </div>

        {importStatus.message && (
          <div className={`text-xs p-3 rounded-xl border flex items-center gap-2 mt-2 ${
            importStatus.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400'
          }`}>
            {importStatus.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Sheet */}
      <div className="p-6 bg-gradient-to-br from-[#FAF6FA] to-[#F8C79A]/15 border border-[#F8C79A]/35 rounded-3xl space-y-4 shadow-sm">
        <h3 className="heading-font text-base font-bold text-[#2E3558] flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-[#8B5CF6]" /> Keyboard Shortcuts Guide
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          <div className="flex justify-between items-center p-3 rounded-xl card-sky-blue shadow-sm">
            <span>Focus URL Save Input</span>
            <kbd className="px-2 py-0.5 bg-white/60 rounded font-mono text-[10px] font-bold text-slate-700">Alt + N</kbd>
          </div>
          
          <div className="flex justify-between items-center p-3 rounded-xl card-peach shadow-sm">
            <span>Go to Dashboard</span>
            <kbd className="px-2 py-0.5 bg-white/60 rounded font-mono text-[10px] font-bold text-slate-700">Alt + D</kbd>
          </div>
 
          <div className="flex justify-between items-center p-3 rounded-xl card-mint-green shadow-sm">
            <span>Go to Categories</span>
            <kbd className="px-2 py-0.5 bg-white/60 rounded font-mono text-[10px] font-bold text-slate-700">Alt + C</kbd>
          </div>
 
          <div className="flex justify-between items-center p-3 rounded-xl card-baby-pink shadow-sm">
            <span>Go to Analytics</span>
            <kbd className="px-2 py-0.5 bg-white/60 rounded font-mono text-[10px] font-bold text-slate-700">Alt + A</kbd>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 glass-panel rounded-3xl border-red-500/20 bg-red-500/5 space-y-4">
        <h3 className="heading-font text-base font-bold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-xs text-slate-550 leading-normal">
          Wiping data is destructive. It deletes all database items, categorizations, badges, level accomplishments, and streaks.
        </p>

        <div className="pt-2">
          <button 
            onClick={handleWipeData}
            disabled={isWiping}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Reset Organizer Account
          </button>
        </div>
      </div>

    </div>
  );
};

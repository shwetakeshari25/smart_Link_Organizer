import React, { useState } from 'react';
import { 
  Heart, Trash2, ExternalLink, Plus, X, Edit3, 
  BookOpen, CheckCircle, Clock, Youtube, Github, 
  Linkedin, Instagram, Twitter, Facebook, Globe, Link2, MessageSquare
} from 'lucide-react';

export interface LinkItem {
  _id: string;
  url: string;
  title: string;
  description: string;
  thumbnail: string;
  favicon: string;
  domain: string;
  platform: string;
  category: string;
  tags: string[];
  favorite: boolean;
  notes: string;
  progress: 'Not Started' | 'Watching' | 'Completed';
  progressPercent: number;
  savedAt: string;
  openedCount: number;
  lastOpened?: string;
}

interface LinkCardProps {
  link: LinkItem;
  onUpdate: (id: string, updates: Partial<LinkItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpen: (id: string) => Promise<void>;
  hasGoldTheme?: boolean;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, onUpdate, onDelete, onOpen, hasGoldTheme }) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(link.notes);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Get logo and color based on platform
  const getPlatformDetails = (platform: string) => {
    switch (platform) {
      case 'YouTube':
        return { icon: <Youtube className="w-5 h-5 text-red-500" />, bg: 'bg-red-500/10', color: 'text-red-500' };
      case 'GitHub':
        return { icon: <Github className="w-5 h-5 text-slate-800 dark:text-slate-200" />, bg: 'bg-slate-500/10', color: 'text-slate-800 dark:text-slate-200' };
      case 'LinkedIn':
        return { icon: <Linkedin className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-600/10', color: 'text-blue-600' };
      case 'Instagram':
        return { icon: <Instagram className="w-5 h-5 text-pink-500" />, bg: 'bg-pink-500/10', color: 'text-pink-500' };
      case 'Twitter/X':
        return { icon: <Twitter className="w-5 h-5 text-sky-500" />, bg: 'bg-sky-500/10', color: 'text-sky-500' };
      case 'Facebook':
        return { icon: <Facebook className="w-5 h-5 text-blue-700" />, bg: 'bg-blue-700/10', color: 'text-blue-700' };
      case 'Reddit':
        return { icon: <MessageSquare className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-500/10', color: 'text-orange-500' };
      case 'Medium':
        return { icon: <BookOpen className="w-5 h-5 text-green-600" />, bg: 'bg-green-600/10', color: 'text-green-600' };
      case 'Dev.to':
        return { icon: <Link2 className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-600/10', color: 'text-purple-600' };
      case 'Personal Website':
        return { icon: <Globe className="w-5 h-5 text-teal-600" />, bg: 'bg-teal-600/10', color: 'text-teal-600' };
      default:
        return { icon: <Link2 className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10', color: 'text-blue-500' };
    }
  };

  const platformInfo = getPlatformDetails(link.platform);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onUpdate(link._id, { favorite: !link.favorite });
  };

  const handleProgressChange = async (newProgress: 'Not Started' | 'Watching' | 'Completed') => {
    let percent = 0;
    if (newProgress === 'Watching') percent = 50;
    if (newProgress === 'Completed') percent = 100;
    await onUpdate(link._id, { progress: newProgress, progressPercent: percent });
  };

  const handleSaveNotes = async () => {
    await onUpdate(link._id, { notes: noteText });
    setIsEditingNotes(false);
  };

  const handleAddTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !link.tags.includes(trimmed)) {
      const updatedTags = [...link.tags, trimmed];
      await onUpdate(link._id, { tags: updatedTags });
      setNewTag('');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = link.tags.filter(t => t !== tagToRemove);
    await onUpdate(link._id, { tags: updatedTags });
  };

  const handleLinkClick = () => {
    onOpen(link._id);
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Saved Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Saved Yesterday';
      }
      return 'Saved ' + date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Saved recently';
    }
  };

  const getPlatformGradient = (platform: string) => {
    switch (platform) {
      case 'YouTube': return 'from-[#FF416C] to-[#FF4B2B]';
      case 'GitHub': return 'from-[#4A00E0] to-[#8E2DE2]';
      case 'LinkedIn': return 'from-[#00c6ff] to-[#0072ff]';
      case 'Instagram': return 'from-[#f857a6] to-[#ff5858]';
      case 'Twitter/X': return 'from-[#11998e] to-[#38ef7d]';
      case 'Facebook': return 'from-[#6850F2] to-[#5136E0]';
      case 'Reddit': return 'from-[#ff7e5f] to-[#feb47b]';
      case 'Medium': return 'from-[#00b09b] to-[#96c93d]';
      case 'Dev.to': return 'from-[#ea00d9] to-[#711c91]';
      case 'Personal Website': return 'from-[#4facfe] to-[#00f2fe]';
      default: return 'from-[#6850F2] to-[#34BEA9]';
    }
  };

  const getPlatformBg = (platform: string) => {
    switch (platform) {
      case 'YouTube': return 'bg-[#FFF0F3] border-[#F58FA8]/30';
      case 'GitHub': return 'bg-[#F5F5FC] border-[#5B5FEF]/20';
      case 'LinkedIn': return 'bg-[#EBF9FF] border-[#49C6F8]/30';
      case 'Instagram': return 'bg-[#FFF0FA] border-[#F8B4D9]/30';
      case 'Twitter/X': return 'bg-[#EDFCFF] border-[#59D9F8]/30';
      case 'Facebook': return 'bg-[#F3E8FF] border-[#6850F2]/20';
      case 'Reddit': return 'bg-[#FFF7F0] border-[#F8C79A]/30';
      case 'Medium': return 'bg-[#F0FFF9] border-[#7EE7C4]/30';
      case 'Dev.to': return 'bg-[#F7F2FF] border-[#8B5CF6]/30';
      case 'Personal Website': return 'bg-[#EEFDFB] border-[#42E2D0]/30';
      default: return 'bg-[#FAF6FA] border-[#C8B6FF]/30';
    }
  };

  return (
    <div className={`glass-card flex flex-col h-full rounded-2xl overflow-hidden border shadow-sm transition-all hover:scale-[1.02] ${
      hasGoldTheme 
        ? 'border-yellow-400 dark:border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)] dark:shadow-[0_0_20px_rgba(234,179,8,0.25)] bg-gradient-to-tr from-yellow-500/5 to-transparent' 
        : getPlatformBg(link.platform)
    }`}>
      {/* Platform Gradient Stripe */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${getPlatformGradient(link.platform)}`} />
      
      {/* Thumbnail area */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900 group">
        {link.thumbnail ? (
          <img 
            src={link.thumbnail} 
            alt={link.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              // If image fails, fallback to simple styling
              (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%232563EB"/></svg>`
              )}`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{link.platform}</span>
          </div>
        )}
        
        {/* Floating platform logo and domain */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-sm border border-white/20">
          <img 
            src={link.favicon || `https://www.google.com/s2/favicons?sz=32&domain=${link.domain}`} 
            alt="" 
            className="w-3.5 h-3.5 rounded-sm"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <span className="truncate max-w-[120px]">{link.domain}</span>
        </div>

        {/* Favorite Icon */}
        <button 
          onClick={handleFavoriteToggle}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all border shadow-sm ${
            link.favorite 
              ? 'bg-rose-500 border-rose-400 text-white scale-110' 
              : 'bg-white/80 dark:bg-slate-900/80 border-white/20 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:scale-105'
          }`}
        >
          <Heart className={`w-4 h-4 ${link.favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Reading Progress Indicator Overlay */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 backdrop-blur-md shadow-sm ${
            link.progress === 'Completed' 
              ? 'bg-emerald-500/90 text-white' 
              : link.progress === 'Watching' 
                ? 'bg-amber-500/90 text-white' 
                : 'bg-slate-800/80 text-slate-200'
          }`}>
            {link.progress === 'Completed' && <CheckCircle className="w-3 h-3" />}
            {link.progress === 'Watching' && <Clock className="w-3 h-3" />}
            {link.progress}
          </span>
        </div>
      </div>

      {/* Info content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {formatDate(link.savedAt)}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${platformInfo.bg} ${platformInfo.color}`}>
              {link.category}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={handleLinkClick}
            className="heading-font text-[15px] font-bold leading-snug text-slate-800 dark:text-slate-100 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer line-clamp-2 mb-1.5 transition-colors"
            title={link.title}
          >
            {link.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {link.description || 'No description available.'}
          </p>

          {/* Progress Bar */}
          {link.progressPercent > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">
                <span>Progress</span>
                <span>{link.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    link.progress === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${link.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags list */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {link.tags.map((tag) => (
              <span 
                key={tag} 
                className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-md font-medium flex items-center gap-1 group/tag"
              >
                #{tag}
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                  title="Remove tag"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            
            {isEditingTags ? (
              <div className="flex items-center gap-1">
                <input 
                  type="text" 
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag(newTag);
                    if (e.key === 'Escape') setIsEditingTags(false);
                  }}
                  placeholder="tag..."
                  className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 w-16"
                  autoFocus
                />
                <button 
                  onClick={() => handleAddTag(newTag)}
                  className="p-0.5 text-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => setIsEditingTags(false)}
                  className="p-0.5 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditingTags(true)}
                className="text-[10px] px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:border-blue-400 dark:hover:text-blue-400 rounded-md font-semibold transition-colors flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Tag
              </button>
            )}
          </div>

          {/* Notes display */}
          {link.notes && !isEditingNotes && (
            <div className="p-2.5 bg-yellow-50/50 dark:bg-yellow-950/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl mb-4 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed italic flex items-start gap-1.5">
              <Edit3 className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="flex-1 line-clamp-3 break-words">{link.notes}</div>
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="text-[10px] font-bold text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 ml-1"
              >
                Edit
              </button>
            </div>
          )}

          {isEditingNotes && (
            <div className="mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a personal note..."
                rows={2}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex justify-end gap-1.5 mt-1">
                <button 
                  onClick={() => setIsEditingNotes(false)}
                  className="px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveNotes}
                  className="px-2.5 py-1 text-[10px] text-white bg-blue-600 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex items-center justify-between gap-1.5">
          {/* Progress Selector */}
          <div className="relative">
            <select
              value={link.progress}
              onChange={(e) => handleProgressChange(e.target.value as any)}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 px-2 py-1.5 rounded-lg outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              <option value="Not Started">Not Started</option>
              <option value="Watching">Watching</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {!link.notes && !isEditingNotes && (
              <button 
                onClick={() => setIsEditingNotes(true)}
                className="p-2 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Add Notes"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button 
              onClick={handleLinkClick}
              className="p-2 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Open Link"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(link._id)}
              className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Delete Link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

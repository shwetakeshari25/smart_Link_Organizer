import React, { useState } from 'react';
import { 
  Folder, Edit3, Search, Star, Filter,
  ArrowLeft, Trash2, FolderPlus, Bookmark, X,
  Youtube, Instagram, Linkedin, Github, Facebook, Globe, Link
} from 'lucide-react';
import { LinkCard } from './LinkCard';
import type { LinkItem } from './LinkCard';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

interface CollectionItem {
  id: string;
  name: string;
  description: string;
}

interface CategoriesViewProps {
  links: LinkItem[];
  categories: CategoryItem[];
  collections: CollectionItem[];
  onRenameCategory: (id: string, newName: string, icon: string) => Promise<void>;
  onCreateCollection: (name: string, description: string) => Promise<void>;
  onDeleteCollection: (id: string) => Promise<void>;
  onUpdateLink: (id: string, updates: Partial<LinkItem>) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onOpenLink: (id: string) => Promise<void>;
  stats: any;
  onSolveVideoQuiz?: (linkId: string, answerIndex: number) => Promise<{ success: boolean; message: string; coins?: number; xp?: number }>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  links,
  categories,
  collections,
  onRenameCategory,
  onCreateCollection,
  onDeleteCollection,
  onUpdateLink,
  onDeleteLink,
  onOpenLink,
  stats,
  onSolveVideoQuiz
}) => {
  // Helper to map category name to its brand icon matching the screen photo
  const getCategoryBrandIcon = (name: string) => {
    const iconClass = "w-6 h-6";
    switch (name) {
      case 'YouTube':
        return <Youtube className={`${iconClass} text-[#FF0000] fill-current`} />;
      case 'Instagram':
        return <Instagram className={`${iconClass} text-[#E1306C]`} />;
      case 'LinkedIn':
        return <Linkedin className={`${iconClass} text-[#0077B5] fill-current`} />;
      case 'GitHub':
        return <Github className={`${iconClass} text-[#181717] fill-current`} />;
      case 'Twitter/X':
        return <svg viewBox="0 0 24 24" className={`${iconClass} text-black fill-current`}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
      case 'Facebook':
        return <Facebook className={`${iconClass} text-[#1877F2] fill-current`} />;
      case 'Reddit':
        return (
          <svg viewBox="0 0 24 24" className={`${iconClass} text-[#FF4500] fill-current`}>
            <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.68-6.23-1.78l1.32-4.17 4.26 1c.02.79.68 1.4 1.48 1.4 1.1 0 2-.9 2-2s-.9-2-2-2c-.74 0-1.36.4-1.72.97l-4.7-1.1c-.24-.05-.47.1-.53.34L10.8 7.95C8.36 8.05 6.07 8.75 4.38 9.77c-.55-.77-1.46-1.27-2.48-1.27-1.65 0-3 1.35-3 3 0 1.23.75 2.27 1.8 2.73-.07.4-.1.82-.1 1.24 0 3.32 4.03 6.03 9 6.03s9-2.7 9-6.03c0-.42-.03-.84-.1-1.24 1.05-.46 1.8-1.5 1.8-2.73zM6 13.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5S6 14.33 6 13.5zm9.5 4.5c-1.5 1.5-4.5 1.5-6 0-.3-.3-.3-.7 0-1 .3-.3.7-.3 1 0 .9.9 3.1.9 4 0 .3-.3.7-.3 1 0 .3.3.3.7 0 1zM16.5 15c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        );
      case 'Medium':
        return (
          <svg viewBox="0 0 24 24" className={`${iconClass} text-black fill-current`}>
            <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75c.66 0 1.19 2.58 1.19 5.75z"/>
          </svg>
        );
      case 'Dev.to':
        return (
          <svg viewBox="0 0 24 24" className={`${iconClass} text-[#0A0A0A] fill-none stroke-current`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case 'Personal Website':
        return <Globe className={`${iconClass} text-[#0F766E]`} />;
      default:
        return <Link className={`${iconClass} text-[#E11D48]`} />;
    }
  };

  // Navigation State
  // 'categories' | 'category-detail' | 'collection-detail'
  const [viewMode, setViewMode] = useState<'grid' | 'category' | 'collection'>('grid');
  const [selectedFolderName, setSelectedFolderName] = useState('');
  const [selectedFolderIcon, setSelectedFolderIcon] = useState('📁');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  // Editing Category State
  const [editingCatId, setEditingCatId] = useState('');
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  // New Collection State
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  // Counts links in a category
  const getCategoryCount = (catName: string) => {
    return links.filter(l => l.category.toLowerCase() === catName.toLowerCase()).length;
  };

  // Counts links in a collection/tag
  const getCollectionCount = (colName: string) => {
    // We map collections to links using tags or notes or platform. Let's count links matching tag = colName
    return links.filter(l => l.tags.some(t => t.toLowerCase() === colName.toLowerCase())).length;
  };

  const handleOpenCategory = (cat: CategoryItem) => {
    setSelectedFolderName(cat.name);
    setSelectedFolderIcon(cat.icon);
    setViewMode('category');
  };

  const handleOpenCollection = (col: CollectionItem) => {
    setSelectedFolderName(col.name);
    setSelectedFolderIcon('📁');
    setViewMode('collection');
  };

  const handleStartRename = (e: React.MouseEvent, cat: CategoryItem) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
  };

  const handleSaveRename = async () => {
    if (editCatName.trim() && editingCatId) {
      await onRenameCategory(editingCatId, editCatName.trim(), editCatIcon);
      setEditingCatId('');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newColName.trim()) {
      await onCreateCollection(newColName.trim(), newColDesc.trim());
      setNewColName('');
      setNewColDesc('');
      setShowNewCollectionModal(false);
    }
  };

  const handleDeleteCol = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this folder/collection?')) {
      await onDeleteCollection(id);
    }
  };

  // Filter links based on category/collection detail view
  const getFilteredLinks = () => {
    let list = [...links];

    // 1. Folder Context Filter
    if (viewMode === 'category') {
      list = list.filter(l => l.category.toLowerCase() === selectedFolderName.toLowerCase());
    } else if (viewMode === 'collection') {
      list = list.filter(l => l.tags.some(t => t.toLowerCase() === selectedFolderName.toLowerCase()));
    }

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      list = list.filter(l => 
        (l.title && l.title.toLowerCase().includes(s)) ||
        (l.description && l.description.toLowerCase().includes(s)) ||
        (l.domain && l.domain.toLowerCase().includes(s)) ||
        (l.tags && l.tags.some(t => t.toLowerCase().includes(s)))
      );
    }

    // 3. Time Filter
    if (timeFilter !== 'all') {
      const now = new Date();
      list = list.filter(l => {
        const date = new Date(l.savedAt);
        const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (timeFilter === 'today') return diffDays <= 1;
        if (timeFilter === 'week') return diffDays <= 7;
        if (timeFilter === 'month') return diffDays <= 30;
        return true;
      });
    }

    // 4. Favorite Filter
    if (favoriteOnly) {
      list = list.filter(l => l.favorite);
    }

    // 5. Tag Filter
    if (selectedTag) {
      list = list.filter(l => l.tags.includes(selectedTag));
    }

    return list;
  };

  const filteredLinks = getFilteredLinks();
  const allUniqueTags = Array.from(new Set(links.flatMap(l => l.tags)));

  return (
    <div className="space-y-6">
      
      {/* 1. GRID VIEW OF FOLDERS (Categories & Collections) */}
      {viewMode === 'grid' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Categories Grid */}
          <div className="space-y-4">
            <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white">
              Categories
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Explore your links organized automatically by platform type.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const count = getCategoryCount(cat.name);
                const isEditing = editingCatId === cat.id;

                return (
                  <div 
                    key={cat.id}
                    onClick={() => !isEditing && handleOpenCategory(cat)}
                    className={`p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/30 flex flex-col justify-between h-40 cursor-pointer relative group/folder category-folder-${cat.name.replace('/', '').replace(' ', '').replace('.', '')}`}
                  >
                    {isEditing ? (
                      <div className="space-y-3 flex-1 flex flex-col justify-between" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editCatIcon}
                            onChange={(e) => setEditCatIcon(e.target.value)}
                            className="w-10 text-center p-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg outline-none"
                            placeholder="icon"
                          />
                          <input 
                            type="text" 
                            value={editCatName}
                            onChange={(e) => setEditCatName(e.target.value)}
                            className="flex-1 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                            placeholder="Category Name"
                          />
                        </div>
                        <div className="flex gap-1 justify-end">
                          <button 
                            onClick={() => setEditingCatId('')}
                            className="px-2.5 py-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveRename}
                            className="px-2.5 py-1 text-[10px] bg-blue-600 text-white rounded font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md">
                            {getCategoryBrandIcon(cat.name)}
                          </div>
                          <button 
                            onClick={(e) => handleStartRename(e, cat)}
                            className="opacity-0 group-hover/folder:opacity-100 p-1.5 hover:text-blue-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-all"
                            title="Rename Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div>
                          <h3 className="heading-font text-base font-extrabold text-slate-800 dark:text-white mb-0.5 truncate">
                            {cat.name}
                          </h3>
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {count} {count === 1 ? 'link' : 'links'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collections Grid */}
          <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/30">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="heading-font text-xl font-extrabold text-slate-800 dark:text-white">
                  Collections & Folders
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Organize links under tags as custom folders (e.g. Placement, College, AI).
                </p>
              </div>
              <button 
                onClick={() => setShowNewCollectionModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" /> Create Folder
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {collections.map((col, index) => {
                const count = getCollectionCount(col.name);
                return (
                  <div 
                    key={col.id}
                    onClick={() => handleOpenCollection(col)}
                    className={`p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/30 flex flex-col justify-between h-40 cursor-pointer group/col category-folder-grad-${(index + 3) % 10}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-[#5B5FEF]">
                        <Folder className="w-6 h-6 fill-current" />
                      </div>
                      <button 
                        onClick={(e) => handleDeleteCol(e, col.id)}
                        className="opacity-0 group-hover/col:opacity-100 p-1.5 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-500 transition-all"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="heading-font text-base font-extrabold text-slate-800 dark:text-white mb-0.5 truncate">
                        {col.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mb-1">
                        {col.description || 'No description'}
                      </p>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {count} {count === 1 ? 'link' : 'links'} (tagged)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. INNER DETAIL VIEW OF A SELECTED CATEGORY OR COLLECTION */}
      {viewMode !== 'grid' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Back Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode('grid')}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{selectedFolderIcon}</span>
                  <h1 className="heading-font text-2xl font-extrabold text-slate-800 dark:text-white leading-none">
                    {selectedFolderName}
                  </h1>
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
                  Folder View ({filteredLinks.length} Links)
                </p>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search within this folder..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-800 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtering Sub-Bar */}
          <div className="p-4 glass-panel rounded-3xl border-slate-200/50 dark:border-slate-800/30 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters
              </span>
              
              {/* Time Selection */}
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <option value="all">Anytime</option>
                <option value="today">Saved Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* Tag Selection */}
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <option value="">All Tags</option>
                {allUniqueTags.map(t => (
                  <option key={t} value={t}>#{t}</option>
                ))}
              </select>

              {/* Favorites Toggle */}
              <button
                onClick={() => setFavoriteOnly(!favoriteOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  favoriteOnly 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-current' : ''}`} /> Favorites
              </button>
            </div>

            {/* Clear Filters */}
            {(searchTerm || timeFilter !== 'all' || favoriteOnly || selectedTag) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setTimeFilter('all');
                  setFavoriteOnly(false);
                  setSelectedTag('');
                }}
                className="text-xs text-blue-500 hover:text-blue-600 font-bold"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Links Grid inside category */}
          {filteredLinks.length === 0 ? (
            <div className="p-16 glass-panel rounded-3xl text-center border-slate-200/50 dark:border-slate-800/30">
              <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white heading-font">No matching links</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                No links match the active filters or search terms. Try modifying your filter options.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredLinks.map((link) => (
                <LinkCard 
                  key={link._id} 
                  link={link} 
                  onUpdate={onUpdateLink} 
                  onDelete={onDeleteLink}
                  onOpen={onOpenLink}
                  hasGoldTheme={stats?.badges?.includes("Theme: Gold Card Glow")}
                  onSolveVideoQuiz={onSolveVideoQuiz}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. NEW COLLECTION DIALOG MODAL */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 glass-panel rounded-3xl border-slate-200/50 dark:border-slate-800/30 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="heading-font text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <FolderPlus className="w-5 h-5 text-indigo-500" /> Create Custom Folder
              </h3>
              <button 
                onClick={() => setShowNewCollectionModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                  Folder Name (Matching Tag)
                </label>
                <input 
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Placement, College Notes, AI"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  placeholder="What is this collection about?"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white outline-none focus:border-blue-500 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

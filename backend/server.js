import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, Link, Category, Collection, Gamification } from './db.js';
import { scrapeMetadata, detectPlatform } from './scraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database connection
await connectDB();

// rotating educational daily trivia quiz pool
const QUIZ_POOL = [
  {
    question: "Which HTML5 element is used to display self-contained content, like illustrations, diagrams, or photos?",
    options: ["<aside>", "<figure>", "<section>", "<details>"],
    answerIndex: 1,
    coinsReward: 25
  },
  {
    question: "What is the primary purpose of a database index?",
    options: ["To encrypt data", "To speed up data retrieval", "To save storage space", "To prevent duplicate entries"],
    answerIndex: 1,
    coinsReward: 25
  },
  {
    question: "In JavaScript, what is the value of 'typeof null'?",
    options: ["'null'", "'undefined'", "'object'", "'number'"],
    answerIndex: 2,
    coinsReward: 25
  },
  {
    question: "Which Git command is used to combine multiple commits into a single commit before pushing?",
    options: ["git merge", "git squash", "git rebase -i", "git commit --amend"],
    answerIndex: 2,
    coinsReward: 25
  },
  {
    question: "What does the 'S' in SOLID design principles stand for?",
    options: ["Scope Isolation", "Single Responsibility", "State Management", "System Scalability"],
    answerIndex: 1,
    coinsReward: 25
  },
  {
    question: "Which CSS layout model is designed for one-dimensional layouts (either columns or rows)?",
    options: ["CSS Grid", "Flexbox", "Floats", "Positioning"],
    answerIndex: 1,
    coinsReward: 25
  },
  {
    question: "Which HTTP status code represents a successful resource deletion?",
    options: ["200 OK", "201 Created", "204 No Content", "404 Not Found"],
    answerIndex: 2,
    coinsReward: 25
  }
];

// Gamification Helpers
function getLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  return Math.floor(5 + (xp - 2000) / 1000);
}

// XP caps per level
function getXpForNextLevel(level) {
  const levelsXp = { 1: 100, 2: 250, 3: 500, 4: 1000, 5: 2000 };
  if (level >= 5) return 2000 + (level - 5) * 1000;
  return levelsXp[level];
}

async function addXP(amount, actionName = '') {
  const stats = await Gamification.findOne();
  const currentXp = stats.xp;
  const newXp = currentXp + amount;
  const oldLevel = stats.level;
  const newLevel = getLevel(newXp);
  
  let levelUp = false;
  if (newLevel > oldLevel) {
    levelUp = true;
  }

  // Update Streak if needed
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let newStreak = stats.streak;
  if (stats.lastActiveDate !== todayStr) {
    if (stats.lastActiveDate === yesterdayStr) {
      newStreak += 1;
    } else if (stats.lastActiveDate === '') {
      newStreak = 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }
  }

  // Check Badges Unlocks
  const updatedBadges = [...stats.badges];
  const totalLinksCount = await Link.countDocuments();
  const completedLinksCount = await Link.countDocuments({ progress: 'Completed' });

  // Badge: First Link
  if (totalLinksCount >= 1 && !updatedBadges.includes('First Link')) {
    updatedBadges.push('First Link');
  }
  // Badge: Consistency King
  if (newStreak >= 5 && !updatedBadges.includes('Consistency King')) {
    updatedBadges.push('Consistency King');
  }
  // Badge: Learning Master
  if (completedLinksCount >= 3 && !updatedBadges.includes('Learning Master')) {
    updatedBadges.push('Learning Master');
  }
  // Badge: Power User
  if (newLevel >= 3 && !updatedBadges.includes('Power User')) {
    updatedBadges.push('Power User');
  }

  const updatedStats = await Gamification.findOneAndUpdate(
    {},
    {
      $set: {
        xp: newXp,
        level: newLevel,
        streak: newStreak,
        lastActiveDate: todayStr,
        badges: updatedBadges
      }
    }
  );

  return {
    xpAdded: amount,
    newXp,
    levelUp,
    newLevel,
    newStreak,
    badges: updatedBadges
  };
}

async function updateMissionProgress(missionId, incrementBy = 1) {
  const stats = await Gamification.findOne();
  const missions = stats.dailyMissions.map(m => {
    if (m.id === missionId && !m.completed) {
      const current = m.current + incrementBy;
      const completed = current >= m.target;
      return { ...m, current: Math.min(current, m.target), completed };
    }
    return m;
  });
  
  await Gamification.findOneAndUpdate({}, { $set: { dailyMissions: missions } });
}

// Routes

// 1. Fetch Metadata Endpoint
app.get('/api/metadata', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  try {
    const meta = await scrapeMetadata(url);
    res.json(meta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Links API
app.get('/api/links', async (req, res) => {
  const { search, category, favorite, tag, filterType } = req.query;
  try {
    let query = {};
    if (category) query.category = category;
    if (favorite === 'true') query.favorite = true;
    if (tag) query.tags = { $in: [tag] };

    let links = await Link.find(query);

    // Apply search filter (case insensitive)
    if (search) {
      const s = search.toLowerCase();
      links = links.filter(link => 
        (link.title && link.title.toLowerCase().includes(s)) ||
        (link.description && link.description.toLowerCase().includes(s)) ||
        (link.domain && link.domain.toLowerCase().includes(s)) ||
        (link.tags && link.tags.some(t => t.toLowerCase().includes(s))) ||
        (link.platform && link.platform.toLowerCase().includes(s))
      );
    }

    // Apply time/recent filter
    if (filterType) {
      const now = new Date();
      links = links.filter(link => {
        const savedDate = new Date(link.savedAt);
        const diffTime = Math.abs(now - savedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (filterType === 'today') return diffDays <= 1;
        if (filterType === 'week') return diffDays <= 7;
        if (filterType === 'month') return diffDays <= 30;
        if (filterType === 'recently_opened') return link.openedCount > 0;
        return true;
      });
      
      if (filterType === 'recently_opened') {
        links.sort((a, b) => new Date(b.lastOpened || 0) - new Date(a.lastOpened || 0));
      }
    }

    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/links', async (req, res) => {
  const { url, category: manualCategory, tags = [], notes = '' } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // 1. Scrape link
    const metadata = await scrapeMetadata(url);
    
    // 2. Set Category
    // Use manual category if provided, else auto detect
    const finalCategory = manualCategory || metadata.platform || 'Other';

    // 3. Create link in DB
    const newLink = await Link.create({
      ...metadata,
      category: finalCategory,
      tags,
      notes,
      favorite: false
    });

    // 4. Update Gamification: award XP (+10 XP)
    const gamificationUpdates = await addXP(10, 'Save Link');
    
    // 5. Update Daily Mission: Save Link
    await updateMissionProgress('save_links', 1);

    res.status(201).json({
      link: newLink,
      gamification: gamificationUpdates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/links/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const originalLink = await Link.findById(id);
    if (!originalLink) return res.status(404).json({ error: 'Link not found' });
    
    const updatedLink = await Link.findByIdAndUpdate(id, updates, { new: true });
    
    let xpAward = 0;
    
    // Trigger XP awards based on specific transitions
    if (updates.favorite === true && !originalLink.favorite) {
      xpAward += 2; // +2 XP for adding to Favorites
    }
    
    if (updates.progress === 'Completed' && originalLink.progress !== 'Completed') {
      xpAward += 20; // +20 XP for completing
      // If it is YouTube or GitHub, counts towards "Complete 2 learning videos/articles"
      if (['YouTube', 'GitHub', 'Medium'].includes(updatedLink.platform)) {
        await updateMissionProgress('complete_learning', 1);
      }
    }

    if (updates.tags && updates.tags.length > originalLink.tags.length) {
      const addedTagsCount = updates.tags.length - originalLink.tags.length;
      xpAward += addedTagsCount * 5; // +5 XP per tag
      await updateMissionProgress('add_tags', addedTagsCount);
    }
    
    let gamificationUpdates = null;
    if (xpAward > 0) {
      gamificationUpdates = await addXP(xpAward, 'Link Action');
    } else {
      // Return fresh stats anyway
      const stats = await Gamification.findOne();
      gamificationUpdates = {
        newXp: stats.xp,
        newLevel: stats.level,
        newStreak: stats.streak,
        badges: stats.badges
      };
    }

    res.json({
      link: updatedLink,
      gamification: gamificationUpdates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment link open counts and update daily mission
app.post('/api/links/:id/open', async (req, res) => {
  const { id } = req.params;
  try {
    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ error: 'Link not found' });

    const updated = await Link.findByIdAndUpdate(id, {
      $inc: { openedCount: 1 },
      $set: { lastOpened: new Date().toISOString() }
    });

    // Update Daily Mission: Open link
    await updateMissionProgress('open_links', 1);

    const stats = await Gamification.findOne();
    res.json({ link: updated, gamification: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/links/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Link.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Link not found' });
    res.json({ message: 'Link deleted successfully', deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Gamification API
app.get('/api/gamification', async (req, res) => {
  try {
    const stats = await Gamification.findOne();
    res.json({
      ...stats,
      xpForNextLevel: getXpForNextLevel(stats.level),
      coins: stats.coins || 0,
      dailyQuizSolved: stats.dailyQuizSolved || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gamification/claim/:missionId', async (req, res) => {
  const { missionId } = req.params;
  try {
    const stats = await Gamification.findOne();
    const mission = stats.dailyMissions.find(m => m.id === missionId);
    
    if (!mission) return res.status(404).json({ error: 'Mission not found' });
    if (!mission.completed) return res.status(400).json({ error: 'Mission is not completed yet' });
    if (mission.claimed) return res.status(400).json({ error: 'Reward already claimed' });

    // Mark as claimed
    const updatedMissions = stats.dailyMissions.map(m => 
      m.id === missionId ? { ...m, claimed: true } : m
    );
    
    const currentCoins = stats.coins || 0;
    const coinsAward = mission.coinsReward || 0;
    const newCoins = currentCoins + coinsAward;

    await Gamification.findOneAndUpdate({}, { 
      $set: { 
        dailyMissions: updatedMissions,
        coins: newCoins
      } 
    });

    // Award daily mission XP (+xpReward)
    const xpUpdates = await addXP(mission.xpReward, `Claim Mission: ${mission.title}`);

    res.json({
      ...xpUpdates,
      coins: newCoins
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Daily Missions (Simulated daily trigger or manual for dev testing)
app.post('/api/gamification/reset-missions', async (req, res) => {
  try {
    const missions = [
      { id: 'save_links', title: 'Save 5 links', target: 5, current: 0, xpReward: 50, coinsReward: 15, completed: false, claimed: false },
      { id: 'open_links', title: 'Open 3 saved links', target: 3, current: 0, xpReward: 30, coinsReward: 10, completed: false, claimed: false },
      { id: 'complete_learning', title: 'Complete 2 learning videos/articles', target: 2, current: 0, xpReward: 40, coinsReward: 15, completed: false, claimed: false },
      { id: 'add_tags', title: 'Add 10 tags to links', target: 10, current: 0, xpReward: 25, coinsReward: 10, completed: false, claimed: false },
      { id: 'organize_categories', title: 'Organize/Rename a category', target: 1, current: 0, xpReward: 20, coinsReward: 5, completed: false, claimed: false }
    ];
    await Gamification.findOneAndUpdate({}, { 
      $set: { 
        dailyMissions: missions,
        dailyQuizSolved: false
      } 
    });
    const stats = await Gamification.findOne();
    res.json({ message: 'Daily missions reset successfully', stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily Trivia Quiz Fetch Route
app.get('/api/gamification/quiz', async (req, res) => {
  try {
    const stats = await Gamification.findOne();
    const dayIndex = new Date().getDay();
    const activeQuestion = QUIZ_POOL[dayIndex];
    
    res.json({
      question: activeQuestion.question,
      options: activeQuestion.options,
      coinsReward: activeQuestion.coinsReward,
      solved: stats.dailyQuizSolved || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Daily Trivia Quiz Submit Route
app.post('/api/gamification/quiz/solve', async (req, res) => {
  const { answerIndex } = req.body;
  try {
    const stats = await Gamification.findOne();
    if (stats.dailyQuizSolved) {
      return res.status(400).json({ error: "You have already solved today's quiz!" });
    }
    
    const dayIndex = new Date().getDay();
    const activeQuestion = QUIZ_POOL[dayIndex];
    
    if (parseInt(answerIndex) === activeQuestion.answerIndex) {
      const currentCoins = stats.coins || 0;
      const newCoins = currentCoins + activeQuestion.coinsReward;
      
      await Gamification.findOneAndUpdate({}, {
        $set: {
          coins: newCoins,
          dailyQuizSolved: true
        }
      });
      
      res.json({
        success: true,
        message: `Correct answer! Awarded ${activeQuestion.coinsReward} coins.`,
        coins: newCoins,
        dailyQuizSolved: true
      });
    } else {
      res.json({
        success: false,
        message: "Incorrect answer. Try again!"
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cosmetics Redemption Shop Route
app.post('/api/gamification/shop/redeem', async (req, res) => {
  const { itemId } = req.body;
  const shopItems = {
    "title_ai": { name: "Title: AI Explorer", cost: 50 },
    "title_legend": { name: "Title: Link Legend", cost: 100 },
    "theme_gold": { name: "Theme: Gold Card Glow", cost: 75 }
  };
  
  const item = shopItems[itemId];
  if (!item) return res.status(404).json({ error: "Item not found in shop" });
  
  try {
    const stats = await Gamification.findOne();
    const currentCoins = stats.coins || 0;
    
    if (currentCoins < item.cost) {
      return res.status(400).json({ error: `Insufficient coins! You need ${item.cost} coins.` });
    }
    
    if (stats.badges.includes(item.name)) {
      return res.status(400).json({ error: "You have already unlocked this item!" });
    }
    
    const newCoins = currentCoins - item.cost;
    const updatedBadges = [...stats.badges, item.name];
    
    await Gamification.findOneAndUpdate({}, {
      $set: {
        coins: newCoins,
        badges: updatedBadges
      }
    });
    
    res.json({
      success: true,
      message: `Successfully redeemed ${item.name}!`,
      coins: newCoins,
      badges: updatedBadges
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename category - Updates links automatically!
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name: newName, icon } = req.body;

  try {
    const oldCategories = await Category.find();
    const categoryToUpdate = oldCategories.find(c => c.id === id);
    if (!categoryToUpdate) return res.status(404).json({ error: 'Category not found' });

    const oldName = categoryToUpdate.name;

    // Update category entry
    const updatedCategory = await Category.findOneAndUpdate({ id }, { name: newName, icon });

    // Update all links with the old category name to use the new name!
    const linksToUpdate = await Link.find({ category: oldName });
    for (let link of linksToUpdate) {
      await Link.findByIdAndUpdate(link._id, { category: newName });
    }

    // Award XP for organizing categories
    await updateMissionProgress('organize_categories', 1);
    const gamificationUpdates = await addXP(5, 'Organize Category');

    res.json({
      category: updatedCategory,
      gamification: gamificationUpdates,
      updatedLinksCount: linksToUpdate.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, icon } = req.body;
  try {
    const newCat = await Category.create({ name, icon });
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Collections/Folders API
app.get('/api/collections', async (req, res) => {
  try {
    const cols = await Collection.find();
    res.json(cols);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collections', async (req, res) => {
  const { name, description } = req.body;
  try {
    const newCol = await Collection.create({ name, description });
    res.status(201).json(newCol);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/collections/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Collection.findByIdAndDelete(id);
    res.json({ message: 'Collection deleted', deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Notifications API
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = [];
    const stats = await Gamification.findOne();
    
    // Check missions
    const incompleteMissions = stats.dailyMissions.filter(m => !m.completed).length;
    if (incompleteMissions > 0) {
      notifications.push({
        id: 'notif_missions',
        type: 'mission',
        title: 'Daily Missions Pending',
        text: `You have ${incompleteMissions} missions to complete today for extra XP!`,
        icon: '🎯'
      });
    }

    // Check unfinished YouTube videos
    const watchingYt = await Link.find({ platform: 'YouTube', progress: 'Watching' });
    if (watchingYt.length > 0) {
      notifications.push({
        id: 'notif_yt',
        type: 'progress',
        title: 'Unfinished Videos',
        text: `You have ${watchingYt.length} videos marked as "Watching". Time to finish them!`,
        icon: '📺'
      });
    }

    // Check unfinished Medium/Dev.to articles
    const readingArticles = await Link.find({ progress: 'Watching' });
    const readingArtCount = readingArticles.filter(l => ['Medium', 'Dev.to'].includes(l.platform)).length;
    if (readingArtCount > 0) {
      notifications.push({
        id: 'notif_art',
        type: 'progress',
        title: 'Continue Reading',
        text: `Resume reading your saved articles (${readingArtCount} in progress).`,
        icon: '✍️'
      });
    }

    // Streak reminder
    if (stats.streak > 0) {
      notifications.push({
        id: 'notif_streak',
        type: 'streak',
        title: 'Streak Active!',
        text: `You are on a 🔥 ${stats.streak}-day streak. Keep it up by saving or organizing links!`,
        icon: '🔥'
      });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Smart Link Organizer backend server running on port ${PORT}`);
});

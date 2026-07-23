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

// rotating general affairs daily trivia quiz pool
const QUIZ_POOL = [
  {
    question: "Which country recently became the 32nd member of NATO in 2024?",
    options: ["Finland", "Sweden", "Ukraine", "Switzerland"],
    answerIndex: 1, // Sweden
    coinsReward: 25
  },
  {
    question: "Who is the current Secretary-General of the United Nations?",
    options: ["Ban Ki-moon", "Kofi Annan", "António Guterres", "Tedros Adhanom"],
    answerIndex: 2, // António Guterres
    coinsReward: 25
  },
  {
    question: "Which space agency successfully landed the Chandrayaan-3 mission near the south pole of the Moon?",
    options: ["NASA (USA)", "ESA (Europe)", "ISRO (India)", "JAXA (Japan)"],
    answerIndex: 2, // ISRO
    coinsReward: 25
  },
  {
    question: "What is the capital city of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    answerIndex: 2, // Canberra
    coinsReward: 25
  },
  {
    question: "Which ocean is the largest and deepest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    answerIndex: 3, // Pacific Ocean
    coinsReward: 25
  },
  {
    question: "Which gas is the most abundant gas in Earth's atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Argon"],
    answerIndex: 1, // Nitrogen
    coinsReward: 25
  },
  {
    question: "Which scientist formulated the theory of General Relativity?",
    options: ["Isaac Newton", "Albert Einstein", "Stephen Hawking", "Niels Bohr"],
    answerIndex: 1, // Albert Einstein
    coinsReward: 25
  }
];

// play anytime riddle game pool
const RIDDLE_POOL = [
  {
    id: "riddle_1",
    question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    options: ["An Echo", "A Cloud", "A Shadow", "A Whisper"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_2",
    question: "You measure my life in hours and I serve you by expiring. I'm quick when I'm thin and slow when I'm fat. What am I?",
    options: ["A Battery", "A Candle", "An Hourglass", "A Matchstick"],
    answerIndex: 1,
    coinsReward: 25
  },
  {
    id: "riddle_3",
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    options: ["A Globe", "A Map", "A Painting", "A Book"],
    answerIndex: 1,
    coinsReward: 25
  },
  {
    id: "riddle_4",
    question: "What has keys but can't open locks, has space but no room, and you can enter but can't go outside?",
    options: ["A Keyboard", "A Closet", "A Rocket", "A Piano"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_5",
    question: "The more of them you take, the more you leave behind. What are they?",
    options: ["Footsteps", "Breaths", "Memories", "Years"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_6",
    question: "What is full of holes but still holds water?",
    options: ["A Sponge", "A Net", "A Bucket", "A Strainer"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_7",
    question: "What has hands but cannot clap?",
    options: ["A Clock", "A Mannequin", "A Tree", "A Glove"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_8",
    question: "What goes up but never comes down?",
    options: ["Age", "A Balloon", "Smoke", "A Kite"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_9",
    question: "I am clean when I am black, and dirty when I am white. What am I?",
    options: ["A Blackboard", "A Coal", "A Towel", "A Paper"],
    answerIndex: 0,
    coinsReward: 25
  },
  {
    id: "riddle_10",
    question: "What has one eye but cannot see?",
    options: ["A Needle", "A Cyclops", "A Storm", "A Potato"],
    answerIndex: 0,
    coinsReward: 25
  }
];

function generateVideoQuizForLink(link) {
  const title = link.title || "the saved video";
  const platform = link.platform || "Video";
  
  const cleanTitle = title.replace(/[^\w\s\-\/\:\(\)\']/gi, '').trim().substring(0, 70);
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('ai') || titleLower.includes('gpt') || titleLower.includes('llm') || titleLower.includes('agent')) {
    return {
      id: `vid_ai_${link._id}`,
      question: `The video "${cleanTitle}" discusses Artificial Intelligence. What is a key characteristic of an AI agent?`,
      options: [
        "It acts autonomously to achieve a set goal",
        "It requires step-by-step user input for every action",
        "It only displays static content on web pages",
        "It is unable to process natural language"
      ],
      answerIndex: 0,
      coinsReward: 25
    };
  }
  
  if (titleLower.includes('react') || titleLower.includes('js') || titleLower.includes('javascript') || titleLower.includes('typescript') || titleLower.includes('frontend')) {
    return {
      id: `vid_web_${link._id}`,
      question: `The video "${cleanTitle}" covers web development. In React, what is the primary purpose of the 'useEffect' hook?`,
      options: [
        "To perform side effects in functional components",
        "To apply CSS styles to HTML elements",
        "To compile JavaScript code into binary",
        "To manage database connection strings"
      ],
      answerIndex: 0,
      coinsReward: 25
    };
  }

  if (titleLower.includes('python') || titleLower.includes('code') || titleLower.includes('programming') || titleLower.includes('develop')) {
    return {
      id: `vid_prog_${link._id}`,
      question: `The video "${cleanTitle}" relates to software engineering. Which of these is a widely-used version control system?`,
      options: [
        "Docker",
        "Git",
        "Kubernetes",
        "Jenkins"
      ],
      answerIndex: 1,
      coinsReward: 25
    };
  }

  if (titleLower.includes('money') || titleLower.includes('earn') || titleLower.includes('business') || titleLower.includes('finance') || titleLower.includes('invest')) {
    return {
      id: `vid_fin_${link._id}`,
      question: `The video "${cleanTitle}" discusses business or finance. What is the definition of 'Revenue'?`,
      options: [
        "The total amount of money brought in by a company's operations",
        "The net profit after subtracting all expenses",
        "The tax paid to the government on capital gains",
        "The amount of debt a company owes to its creditors"
      ],
      answerIndex: 0,
      coinsReward: 25
    };
  }

  return {
    id: `vid_fall_${link._id}`,
    question: `Which of the following topics is most directly related to the saved ${platform} video: "${cleanTitle}"?`,
    options: [
      `A tutorial or content focusing on "${cleanTitle.substring(0, 45)}..."`,
      "A recipe for preparing traditional Japanese sushi",
      "A guide to organic vegetable farming and soil treatment",
      "A deep-dive research into global geothermal energy solutions"
    ],
    answerIndex: 0,
    coinsReward: 25
  };
}

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
    
    // Generate quiz if marking completed
    if (updates.progress === 'Completed' && originalLink.progress !== 'Completed') {
      updates.quizQuestion = generateVideoQuizForLink(originalLink);
      updates.quizSolved = false;
    }

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
      dailyQuizSolved: stats.dailyQuizSolved || false,
      solvedRiddles: stats.solvedRiddles || []
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
    const activeQuestion = QUIZ_POOL[dayIndex % QUIZ_POOL.length];
    
    res.json({
      question: activeQuestion.question,
      options: activeQuestion.options,
      coinsReward: activeQuestion.coinsReward,
      answerIndex: activeQuestion.answerIndex, // Return so user can review correct answer
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
    const activeQuestion = QUIZ_POOL[dayIndex % QUIZ_POOL.length];
    
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
        answerIndex: activeQuestion.answerIndex,
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

// Riddle Fetch Route
app.get('/api/gamification/riddle', async (req, res) => {
  try {
    const stats = await Gamification.findOne();
    const videos = await Link.find({ platform: { $in: ['YouTube', 'Instagram'] } });
    
    const useVideo = videos.length > 0 && Math.random() < 0.3;
    let riddle;
    
    if (useVideo) {
      const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
      riddle = generateVideoQuizForLink(selectedVideo);
      riddle.id = `video_riddle_${selectedVideo._id}`;
    } else {
      const solvedRiddles = stats.solvedRiddles || [];
      const unsolvedRiddles = RIDDLE_POOL.filter(r => !solvedRiddles.includes(r.id));
      
      if (unsolvedRiddles.length > 0) {
        riddle = unsolvedRiddles[Math.floor(Math.random() * unsolvedRiddles.length)];
      } else {
        riddle = RIDDLE_POOL[Math.floor(Math.random() * RIDDLE_POOL.length)];
      }
    }
    
    res.json({
      id: riddle.id,
      question: riddle.question,
      options: riddle.options,
      coinsReward: 25,
      isRiddle: !useVideo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Riddle Solve Route
app.post('/api/gamification/riddle/solve', async (req, res) => {
  const { riddleId, answerIndex } = req.body;
  try {
    const stats = await Gamification.findOne();
    
    let activeRiddle;
    if (riddleId.startsWith('video_riddle_') || riddleId.startsWith('vid_')) {
      const linkId = riddleId.replace('video_riddle_', '').replace('vid_fall_', '').replace('vid_prog_', '').replace('vid_web_', '').replace('vid_ai_', '').replace('vid_fin_', '');
      const link = await Link.findById(linkId);
      if (!link) return res.status(404).json({ error: "Linked video not found" });
      activeRiddle = generateVideoQuizForLink(link);
    } else {
      activeRiddle = RIDDLE_POOL.find(r => r.id === riddleId);
    }
    
    if (!activeRiddle) {
      return res.status(404).json({ error: "Riddle not found" });
    }
    
    if (parseInt(answerIndex) === activeRiddle.answerIndex) {
      const currentCoins = stats.coins || 0;
      const newCoins = currentCoins + 25;
      
      const solvedRiddles = stats.solvedRiddles || [];
      if (!solvedRiddles.includes(riddleId)) {
        solvedRiddles.push(riddleId);
      }
      
      const gamificationUpdates = await addXP(25, 'Solved Riddle');
      
      await Gamification.findOneAndUpdate({}, {
        $set: {
          coins: newCoins,
          solvedRiddles: solvedRiddles
        }
      });
      
      res.json({
        success: true,
        message: "Correct answer! Awarded 25 coins and 25 XP.",
        coins: newCoins,
        xp: gamificationUpdates.newXp,
        level: gamificationUpdates.newLevel,
        gamification: gamificationUpdates
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

// Video-specific Quiz Solve Route
app.post('/api/links/:id/quiz/solve', async (req, res) => {
  const { id } = req.params;
  const { answerIndex } = req.body;
  try {
    const link = await Link.findById(id);
    if (!link) return res.status(404).json({ error: 'Link not found' });
    
    if (link.quizSolved) {
      return res.status(400).json({ error: 'You have already solved the quiz for this video!' });
    }
    
    let activeQuestion = link.quizQuestion;
    if (!activeQuestion) {
      activeQuestion = generateVideoQuizForLink(link);
    }
    
    if (parseInt(answerIndex) === activeQuestion.answerIndex) {
      const stats = await Gamification.findOne();
      const currentCoins = stats.coins || 0;
      const newCoins = currentCoins + 25;
      
      const gamificationUpdates = await addXP(25, 'Video Quiz Solved');
      
      const updatedLink = await Link.findByIdAndUpdate(id, {
        $set: {
          quizSolved: true,
          quizQuestion: activeQuestion
        }
      }, { new: true });
      
      await Gamification.findOneAndUpdate({}, {
        $set: {
          coins: newCoins
        }
      });
      
      res.json({
        success: true,
        message: "Correct! Awarded 25 coins and 25 XP.",
        coins: newCoins,
        xp: gamificationUpdates.newXp,
        level: gamificationUpdates.newLevel,
        link: updatedLink,
        gamification: gamificationUpdates
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

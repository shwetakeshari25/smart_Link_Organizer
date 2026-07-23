import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_DB_PATH = path.join(__dirname, 'db.json');

// Initialize local JSON DB structure if not exists
if (!fs.existsSync(JSON_DB_PATH)) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify({
    links: [],
    gamification: {
      xp: 0,
      level: 1,
      streak: 0,
      coins: 0,
      dailyQuizSolved: false,
      lastActiveDate: '',
      badges: [],
      dailyMissions: [
        { id: 'save_links', title: 'Save 5 links', target: 5, current: 0, xpReward: 50, coinsReward: 15, completed: false, claimed: false },
        { id: 'open_links', title: 'Open 3 saved links', target: 3, current: 0, xpReward: 30, coinsReward: 10, completed: false, claimed: false },
        { id: 'complete_learning', title: 'Complete 2 learning videos/articles', target: 2, current: 0, xpReward: 40, coinsReward: 15, completed: false, claimed: false },
        { id: 'add_tags', title: 'Add 10 tags to links', target: 10, current: 0, xpReward: 25, coinsReward: 10, completed: false, claimed: false },
        { id: 'organize_categories', title: 'Organize/Rename a category', target: 1, current: 0, xpReward: 20, coinsReward: 5, completed: false, claimed: false }
      ]
    },
    categories: [
      { id: 'cat_yt', name: 'YouTube', icon: '📺' },
      { id: 'cat_ig', name: 'Instagram', icon: '📸' },
      { id: 'cat_li', name: 'LinkedIn', icon: '💼' },
      { id: 'cat_gh', name: 'GitHub', icon: '💻' },
      { id: 'cat_tw', name: 'Twitter/X', icon: '🐦' },
      { id: 'cat_fb', name: 'Facebook', icon: '👥' },
      { id: 'cat_rd', name: 'Reddit', icon: '🤖' },
      { id: 'cat_md', name: 'Medium', icon: '✍️' },
      { id: 'cat_dv', name: 'Dev.to', icon: '🛠️' },
      { id: 'cat_web', name: 'Personal Website', icon: '🌐' },
      { id: 'cat_oth', name: 'Other', icon: '🔗' }
    ],
    collections: [
      { id: 'col_1', name: 'Learning', description: 'Development and study links' },
      { id: 'col_2', name: 'Entertainment', description: 'Videos, social and fun links' }
    ]
  }, null, 2));
}

let useLocalDB = false;

// Connect to MongoDB with timeout fallback
export async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_link_organizer';
  try {
    console.log('Attempting to connect to MongoDB...');
    // Short timeout (3 seconds) to fallback quickly if local mongo isn't running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB connected successfully!');
    useLocalDB = false;
  } catch (error) {
    console.warn('MongoDB connection failed. Falling back to local JSON database.');
    console.warn(`Error detail: ${error.message}`);
    useLocalDB = true;
  }
}

// Read local JSON DB helper
function readLocalDB() {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB', err);
    return {};
  }
}

// Write local JSON DB helper
function writeLocalDB(data) {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing JSON DB', err);
  }
}

// Mongoose Schemas (if MongoDB is active)
const LinkSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: String,
  description: String,
  thumbnail: String,
  favicon: String,
  domain: String,
  platform: String,
  category: { type: String, default: 'Other' },
  tags: [String],
  favorite: { type: Boolean, default: false },
  notes: { type: String, default: '' },
  progress: { type: String, default: 'Not Started' }, // 'Not Started', 'Watching', 'Completed'
  progressPercent: { type: Number, default: 0 },
  savedAt: { type: Date, default: Date.now },
  openedCount: { type: Number, default: 0 },
  lastOpened: Date
});

const CategorySchema = new mongoose.Schema({
  id: String,
  name: String,
  icon: String
});

const CollectionSchema = new mongoose.Schema({
  id: String,
  name: String,
  description: String
});

const GamificationSchema = new mongoose.Schema({
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  dailyQuizSolved: { type: Boolean, default: false },
  lastActiveDate: String,
  badges: [String],
  dailyMissions: [{
    id: String,
    title: String,
    target: Number,
    current: Number,
    xpReward: Number,
    coinsReward: { type: Number, default: 0 },
    completed: Boolean,
    claimed: Boolean
  }]
});

const MongoLink = mongoose.models.Link || mongoose.model('Link', LinkSchema);
const MongoCategory = mongoose.models.Category || mongoose.model('Category', CategorySchema);
const MongoCollection = mongoose.models.Collection || mongoose.model('Collection', CollectionSchema);
const MongoGamification = mongoose.models.Gamification || mongoose.model('Gamification', GamificationSchema);

// DB-Agnostic Interface Wrappers
export const Link = {
  find: async (query = {}) => {
    if (!useLocalDB) return MongoLink.find(query).sort({ savedAt: -1 }).lean();
    
    let list = readLocalDB().links || [];
    // Basic filter implementation
    return list.filter(item => {
      for (let key in query) {
        if (key === 'favorite') {
          if (item.favorite !== query.favorite) return false;
        } else if (key === 'category') {
          if (item.category !== query.category) return false;
        } else if (key === 'tags') {
          // If query has tags, it can be an object with $in or direct array/string
          if (query.tags.$in) {
            const matches = item.tags.some(t => query.tags.$in.includes(t));
            if (!matches) return false;
          }
        }
      }
      return true;
    }).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  },

  findById: async (id) => {
    if (!useLocalDB) return MongoLink.findById(id).lean();
    const list = readLocalDB().links || [];
    return list.find(item => item._id === id) || null;
  },

  create: async (data) => {
    if (!useLocalDB) {
      const link = new MongoLink(data);
      return (await link.save()).toObject();
    }
    const db = readLocalDB();
    const newLink = {
      _id: 'lnk_' + Math.random().toString(36).substr(2, 9),
      savedAt: new Date().toISOString(),
      favorite: false,
      notes: '',
      progress: 'Not Started',
      progressPercent: 0,
      openedCount: 0,
      tags: [],
      ...data
    };
    db.links.push(newLink);
    writeLocalDB(db);
    return newLink;
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    if (!useLocalDB) return MongoLink.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
    const db = readLocalDB();
    const idx = db.links.findIndex(item => item._id === id);
    if (idx === -1) return null;
    
    // Mongoose update objects might use $set, $inc, etc. We support simple updates and mongo operators
    let updatedItem = { ...db.links[idx] };
    
    if (update.$set) {
      updatedItem = { ...updatedItem, ...update.$set };
    } else if (update.$inc) {
      for (let key in update.$inc) {
        updatedItem[key] = (updatedItem[key] || 0) + update.$inc[key];
      }
    } else {
      updatedItem = { ...updatedItem, ...update };
    }
    
    db.links[idx] = updatedItem;
    writeLocalDB(db);
    return updatedItem;
  },

  findByIdAndDelete: async (id) => {
    if (!useLocalDB) return MongoLink.findByIdAndDelete(id).lean();
    const db = readLocalDB();
    const idx = db.links.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const deleted = db.links.splice(idx, 1);
    writeLocalDB(db);
    return deleted[0];
  },

  countDocuments: async (query = {}) => {
    if (!useLocalDB) return MongoLink.countDocuments(query);
    const list = await Link.find(query);
    return list.length;
  }
};

export const Category = {
  find: async () => {
    if (!useLocalDB) return MongoCategory.find().lean();
    return readLocalDB().categories || [];
  },

  create: async (data) => {
    if (!useLocalDB) {
      const cat = new MongoCategory(data);
      return (await cat.save()).toObject();
    }
    const db = readLocalDB();
    const newCat = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      ...data
    };
    db.categories.push(newCat);
    writeLocalDB(db);
    return newCat;
  },

  findOneAndUpdate: async (filter, update) => {
    if (!useLocalDB) return MongoCategory.findOneAndUpdate(filter, update, { new: true }).lean();
    const db = readLocalDB();
    const cat = db.categories.find(c => c.name === filter.name || c.id === filter.id);
    if (!cat) return null;
    Object.assign(cat, update);
    writeLocalDB(db);
    return cat;
  }
};

export const Collection = {
  find: async () => {
    if (!useLocalDB) return MongoCollection.find().lean();
    return readLocalDB().collections || [];
  },

  create: async (data) => {
    if (!useLocalDB) {
      const col = new MongoCollection(data);
      return (await col.save()).toObject();
    }
    const db = readLocalDB();
    const newCol = {
      id: 'col_' + Math.random().toString(36).substr(2, 9),
      ...data
    };
    db.collections.push(newCol);
    writeLocalDB(db);
    return newCol;
  },

  findByIdAndDelete: async (id) => {
    if (!useLocalDB) return MongoCollection.findByIdAndDelete(id).lean();
    const db = readLocalDB();
    const idx = db.collections.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const deleted = db.collections.splice(idx, 1);
    writeLocalDB(db);
    return deleted[0];
  }
};

export const Gamification = {
  findOne: async () => {
    if (!useLocalDB) {
      let g = await MongoGamification.findOne().lean();
      if (!g) {
        // Seed default
        const created = new MongoGamification({
          xp: 0, level: 1, streak: 0, coins: 0, dailyQuizSolved: false, lastActiveDate: '', badges: [],
          dailyMissions: [
            { id: 'save_links', title: 'Save 5 links', target: 5, current: 0, xpReward: 50, coinsReward: 15, completed: false, claimed: false },
            { id: 'open_links', title: 'Open 3 saved links', target: 3, current: 0, xpReward: 30, coinsReward: 10, completed: false, claimed: false },
            { id: 'complete_learning', title: 'Complete 2 learning videos/articles', target: 2, current: 0, xpReward: 40, coinsReward: 15, completed: false, claimed: false },
            { id: 'add_tags', title: 'Add 10 tags to links', target: 10, current: 0, xpReward: 25, coinsReward: 10, completed: false, claimed: false },
            { id: 'organize_categories', title: 'Organize/Rename a category', target: 1, current: 0, xpReward: 20, coinsReward: 5, completed: false, claimed: false }
          ]
        });
        g = (await created.save()).toObject();
      }
      return g;
    }
    return readLocalDB().gamification;
  },

  findOneAndUpdate: async (filter, update) => {
    if (!useLocalDB) {
      return MongoGamification.findOneAndUpdate(filter, update, { new: true, upsert: true }).lean();
    }
    const db = readLocalDB();
    let g = db.gamification;
    
    // Support simple object update or mongo operations ($set)
    if (update.$set) {
      g = { ...g, ...update.$set };
    } else {
      g = { ...g, ...update };
    }
    
    db.gamification = g;
    writeLocalDB(db);
    return g;
  }
};

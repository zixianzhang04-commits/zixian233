const path = require('path');
const { app } = require('electron');

let db = null;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'ledger.db');
}

function initDatabase(Database) {
  const dbPath = getDbPath();
  db = new Database(dbPath);

  // WAL mode + foreign keys
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '',
      parentId TEXT,
      sortOrder INTEGER DEFAULT 0,
      FOREIGN KEY (parentId) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      categoryId TEXT NOT NULL,
      subcategoryId TEXT,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now','localtime')),
      updatedAt TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (categoryId) REFERENCES categories(id),
      FOREIGN KEY (subcategoryId) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      categoryId TEXT,
      periodType TEXT DEFAULT 'month',
      amount REAL NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      actionType TEXT NOT NULL,
      targetTable TEXT NOT NULL,
      targetId TEXT NOT NULL,
      oldValue TEXT,
      newValue TEXT,
      createdAt TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_records_date ON records(date DESC);
    CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category ON records(categoryId);
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
  `);

  // Seed categories if empty
  const row = db.prepare('SELECT COUNT(*) AS c FROM categories').get();
  if (row.c === 0) {
    seedCategories();
  }

  return db;
}

function seedCategories() {
  const insert = db.prepare(
    'INSERT INTO categories (id, name, type, icon, color, parentId, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const list = [
    // Expense
    ['cat_eat',       '餐饮', 'expense', '🍽️', '', null, 0],
    ['cat_transport', '交通', 'expense', '🚗', '', null, 1],
    ['cat_shopping',  '购物', 'expense', '🛒', '', null, 2],
    ['cat_housing',   '住房', 'expense', '🏠', '', null, 3],
    ['cat_utilities', '水电', 'expense', '💡', '', null, 4],
    ['cat_phone',     '通讯', 'expense', '📱', '', null, 5],
    ['cat_entertain', '娱乐', 'expense', '🎮', '', null, 6],
    ['cat_medical',   '医疗', 'expense', '💊', '', null, 7],
    ['cat_education', '教育', 'expense', '📚', '', null, 8],
    ['cat_clothing',  '服饰', 'expense', '👗', '', null, 9],
    ['cat_daily',     '日用', 'expense', '🧴', '', null, 10],
    ['cat_social',    '社交', 'expense', '🎉', '', null, 11],
    ['cat_other_exp', '其他支出', 'expense', '📌', '', null, 12],
    // Income
    ['cat_salary',    '工资', 'income', '💼', '', null, 20],
    ['cat_bonus',     '奖金', 'income', '🎁', '', null, 21],
    ['cat_parttime',  '兼职', 'income', '💰', '', null, 22],
    ['cat_invest',    '投资收益', 'income', '📈', '', null, 23],
    ['cat_redpacket', '红包', 'income', '🧧', '', null, 24],
    ['cat_refund',    '退款', 'income', '↩️', '', null, 25],
    ['cat_other_inc', '其他收入', 'income', '💵', '', null, 26],
  ];

  const seedAll = db.transaction(() => {
    for (const cat of list) {
      insert.run(...cat);
    }
  });
  seedAll();
}

function getDatabase() {
  if (!db) throw new Error('数据库未初始化，请先调用 initDatabase()');
  return db;
}

function closeDatabase() {
  if (db) { db.close(); db = null; }
}

module.exports = { initDatabase, getDatabase, closeDatabase, getDbPath };

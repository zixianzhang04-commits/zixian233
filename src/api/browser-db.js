/**
 * 浏览器端 SQLite 数据层
 * 使用 sql.js (WebAssembly) + localStorage 持久化
 * API 与 Electron IPC 保持一致
 */

let db = null;
let SQL = null;

const DB_STORAGE_KEY = 'ledger_db_data';
const crypto = typeof window !== 'undefined' ? window.crypto : null;

function uuidv4() {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function saveToStorage() {
  const data = db.export();
  const arr = Array.from(data);
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(arr));
}

function loadFromStorage() {
  const saved = localStorage.getItem(DB_STORAGE_KEY);
  if (saved) {
    const arr = JSON.parse(saved);
    return new Uint8Array(arr);
  }
  return null;
}

export async function createBrowserDb() {
  const initSqlJs = (await import('sql.js')).default;
  SQL = await initSqlJs({
    locateFile: () => './sql-wasm.wasm',
  });

  const saved = loadFromStorage();
  if (saved) {
    db = new SQL.Database(saved);
  } else {
    db = new SQL.Database();
  }

  // 建表
  db.run('PRAGMA foreign_keys=ON');

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    icon TEXT DEFAULT '', color TEXT DEFAULT '',
    parentId TEXT, sortOrder INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY, amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income','expense')),
    categoryId TEXT NOT NULL, subcategoryId TEXT,
    date TEXT NOT NULL, note TEXT DEFAULT '', images TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT (datetime('now','localtime')),
    updatedAt TEXT DEFAULT (datetime('now','localtime'))
  )`);
  // Migration: add images column if missing, migrate old image data
  try { db.run('ALTER TABLE records ADD COLUMN images TEXT DEFAULT \'[]\''); } catch(e) {}
  try {
    const oldCols = db.exec("PRAGMA table_info(records)");
    const cols = oldCols.length ? oldCols[0].values.map(r => r[1]) : [];
    if (cols.includes('image') && !cols.includes('images')) {
      db.run('ALTER TABLE records ADD COLUMN images TEXT DEFAULT \'[]\'');
    }
    if (cols.includes('image')) {
      db.run("UPDATE records SET images = ('[' || image || ']') WHERE images='[]' AND image IS NOT NULL AND image!=''");
    }
  } catch(e) {}

  db.run(`CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY, categoryId TEXT,
    periodType TEXT DEFAULT 'month', amount REAL NOT NULL,
    startDate TEXT NOT NULL, endDate TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY, actionType TEXT NOT NULL,
    targetTable TEXT NOT NULL, targetId TEXT NOT NULL,
    oldValue TEXT, newValue TEXT,
    createdAt TEXT DEFAULT (datetime('now','localtime'))
  )`);

  db.run('CREATE INDEX IF NOT EXISTS idx_records_date ON records(date DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_records_type ON records(type)');
  db.run('CREATE INDEX IF NOT EXISTS idx_records_category ON records(categoryId)');
  db.run('CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)');

  // 插入预设分类
  const countResult = db.exec('SELECT COUNT(*) AS c FROM categories');
  const count = countResult[0].values[0][0];
  if (count === 0) {
    seedCategories();
  }

  saveToStorage();
  return db;
}

function seedCategories() {
  const parents = [
    // Expense
    ['cat_eat',       '餐饮',   'expense', 'cat-eat', '', null, 0],
    ['cat_transport', '交通',   'expense', 'cat-transport', '', null, 1],
    ['cat_shopping',  '购物',   'expense', 'cat-shopping', '', null, 2],
    ['cat_housing',   '住房',   'expense', 'cat-housing', '', null, 3],
    ['cat_utilities', '水电',   'expense', 'cat-utilities', '', null, 4],
    ['cat_phone',     '通讯',   'expense', 'cat-phone', '', null, 5],
    ['cat_entertain', '娱乐',   'expense', 'cat-entertain', '', null, 6],
    ['cat_medical',   '医疗',   'expense', 'cat-medical', '', null, 7],
    ['cat_education', '教育',   'expense', 'cat-education', '', null, 8],
    ['cat_clothing',  '服饰',   'expense', 'cat-clothing', '', null, 9],
    ['cat_daily',     '日用',   'expense', 'cat-daily', '', null, 10],
    ['cat_social',    '社交',   'expense', 'cat-social', '', null, 11],
    ['cat_other_exp', '其他支出','expense', 'cat-other-exp', '', null, 12],
    // Income
    ['cat_salary',    '工资',   'income', 'cat-salary', '', null, 20],
    ['cat_bonus',     '奖金',   'income', 'cat-bonus', '', null, 21],
    ['cat_parttime',  '兼职',   'income', 'cat-parttime', '', null, 22],
    ['cat_invest',    '投资收益','income', 'cat-invest', '', null, 23],
    ['cat_redpacket', '红包',   'income', 'cat-redpacket', '', null, 24],
    ['cat_refund',    '退款',   'income', 'cat-refund', '', null, 25],
    ['cat_other_inc', '其他收入','income', 'cat-other-inc', '', null, 26],
  ];
  const children = [
    ['cat_eat_meal',    '正餐',   'expense', 'sub-meal', '', 'cat_eat', 0],
    ['cat_eat_snack',   '零食',   'expense', 'sub-snack', '', 'cat_eat', 1],
    ['cat_trans_bus',   '公交',   'expense', 'sub-bus', '', 'cat_transport', 0],
    ['cat_trans_taxi',  '打车',   'expense', 'sub-taxi', '', 'cat_transport', 1],
    ['cat_trans_gas',   '加油',   'expense', 'sub-gas', '', 'cat_transport', 2],
    ['cat_shop_clothes','服饰',   'expense', 'sub-clothes', '', 'cat_shopping', 0],
    ['cat_shop_cos',    '美妆',   'expense', 'sub-cosmetics', '', 'cat_shopping', 1],
    ['cat_shop_digi',   '数码',   'expense', 'sub-digital', '', 'cat_shopping', 2],
  ];
  for (const cat of parents.concat(children)) {
    db.run('INSERT INTO categories (id, name, type, icon, color, parentId, sortOrder) VALUES (?,?,?,?,?,?,?)', cat);
  }
}

// ==================== 查询辅助 ====================

function getOne(sql, params = []) {
  const results = db.exec(sql, params);
  if (!results.length || !results[0].values.length) return null;
  const { columns, values } = results[0];
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[0][i]; });
  return obj;
}

function getAll(sql, params = []) {
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// ==================== 构建 API ====================

export function getApi() {
  // Undo/redo stacks
  let undoStack = [];
  let redoStack = [];

  function pushUndo(action) {
    undoStack.push(action);
    if (undoStack.length > 20) undoStack.shift();
    redoStack = [];
  }

  const api = {
    // 记录
    records: {
      create(data) {
        const id = uuidv4();
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        const full = { id, amount: data.amount, type: data.type, categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || null, date: data.date, note: data.note || '', images: data.images || '[]',
          createdAt: now, updatedAt: now };
        db.run(
          `INSERT INTO records (id, amount, type, categoryId, subcategoryId, date, note, images, createdAt, updatedAt)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [full.id, full.amount, full.type, full.categoryId, full.subcategoryId, full.date, full.note, full.images, full.createdAt, full.updatedAt]
        );
        saveToStorage();
        pushUndo({ type: 'create', recordId: id, newData: full });
        return api.records.get(id);
      },
      update(id, data) {
        const old = api.records.get(id);
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        db.run(
          `UPDATE records SET amount=?, type=?, categoryId=?, subcategoryId=?, date=?, note=?, images=?, updatedAt=? WHERE id=?`,
          [data.amount, data.type, data.categoryId, data.subcategoryId || null, data.date, data.note || '', data.images || '[]', now, id]
        );
        saveToStorage();
        pushUndo({ type: 'update', recordId: id, oldData: old, newData: api.records.get(id) });
        return api.records.get(id);
      },
      delete(id) {
        const record = api.records.get(id);
        db.run('DELETE FROM records WHERE id=?', [id]);
        saveToStorage();
        pushUndo({ type: 'delete', recordId: id, oldData: record });
        return { changes: 1 };
      },
      get(id) {
        return getOne(`
          SELECT r.*, c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor,
                 sc.name AS subcategoryName, sc.icon AS subcategoryIcon
          FROM records r
          LEFT JOIN categories c ON r.categoryId=c.id
          LEFT JOIN categories sc ON r.subcategoryId=sc.id
          WHERE r.id=?`, [id]);
      },
      list(filters = {}) {
        const { type, categoryId, startDate, endDate, keyword, page = 1, pageSize = 50 } = filters;
        const conditions = [], params = [];
        if (type) { conditions.push('r.type=?'); params.push(type); }
        if (categoryId) { conditions.push('(r.categoryId=? OR r.subcategoryId=?)'); params.push(categoryId, categoryId); }
        if (startDate) { conditions.push('r.date>=?'); params.push(startDate); }
        if (endDate) { conditions.push('r.date<=?'); params.push(endDate); }
        if (keyword) { conditions.push('r.note LIKE ?'); params.push(`%${keyword}%`); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * pageSize;
        const totalRow = getOne(`SELECT COUNT(*) AS total FROM records r ${where}`, params);
        const data = getAll(`
          SELECT r.*, c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor,
                 sc.name AS subcategoryName, sc.icon AS subcategoryIcon
          FROM records r
          LEFT JOIN categories c ON r.categoryId=c.id
          LEFT JOIN categories sc ON r.subcategoryId=sc.id
          ${where} ORDER BY r.date DESC, r.createdAt DESC LIMIT ? OFFSET ?`,
          params.concat([pageSize, offset])
        );
        return { total: totalRow ? totalRow.total : 0, page, pageSize, data };
      },
      copyLast() {
        const last = getOne('SELECT * FROM records ORDER BY createdAt DESC LIMIT 1');
        if (!last) return null;
        const today = new Date().toISOString().slice(0, 10);
        return this.create({
          amount: last.amount, type: last.type, categoryId: last.categoryId,
          subcategoryId: last.subcategoryId, date: today, note: last.note,
        });
      },
    },

    // 分类
    categories: {
      create(data) {
        const id = uuidv4();
        const maxRow = getOne('SELECT MAX(sortOrder) AS m FROM categories WHERE type=? AND parentId IS ?',
          [data.type, data.parentId || null]);
        const sortOrder = ((maxRow && maxRow.m) ?? -1) + 1;
        db.run(
          'INSERT INTO categories (id, name, type, icon, color, parentId, sortOrder) VALUES (?,?,?,?,?,?,?)',
          [id, data.name, data.type, data.icon || '', data.color || '', data.parentId || null, sortOrder]
        );
        saveToStorage();
        return getOne('SELECT * FROM categories WHERE id=?', [id]);
      },
      update(id, data) {
        db.run('UPDATE categories SET name=?, icon=?, color=? WHERE id=?',
          [data.name, data.icon || '', data.color || '', id]);
        saveToStorage();
        return getOne('SELECT * FROM categories WHERE id=?', [id]);
      },
      checkDelete(id) {
        const rc = getOne('SELECT COUNT(*) AS c FROM records WHERE categoryId=? OR subcategoryId=?', [id, id]);
        const cc = getOne('SELECT COUNT(*) AS c FROM categories WHERE parentId=?', [id]);
        return {
          hasRecords: rc.c > 0, recordCount: rc.c,
          hasChildren: cc.c > 0, childCount: cc.c,
          deleted: false,
        };
      },
      forceDelete(id) {
        db.run('UPDATE records SET categoryId=NULL WHERE categoryId=?', [id]);
        db.run('UPDATE records SET subcategoryId=NULL WHERE subcategoryId=?', [id]);
        db.run('UPDATE categories SET parentId=NULL WHERE parentId=?', [id]);
        db.run('DELETE FROM categories WHERE id=?', [id]);
        saveToStorage();
        return db.getRowsModified() > 0;
      },
      get(id) { return getOne('SELECT * FROM categories WHERE id=?', [id]); },
      list(type) {
        if (type) return getAll('SELECT * FROM categories WHERE type=? ORDER BY sortOrder ASC', [type]);
        return getAll('SELECT * FROM categories ORDER BY type, sortOrder ASC');
      },
      tree(type) {
        const all = getAll('SELECT * FROM categories WHERE type=? ORDER BY sortOrder ASC', [type]);
        const parents = all.filter(c => !c.parentId);
        const children = all.filter(c => c.parentId);
        return parents.map(p => ({
          ...p,
          children: children.filter(c => c.parentId === p.id),
        }));
      },
      updateOrder(id, sortOrder) {
        db.run('UPDATE categories SET sortOrder=? WHERE id=?', [sortOrder, id]);
        saveToStorage();
      },
    },

    // 预算
    budgets: {
      get(periodType = 'month') {
        const now = new Date().toISOString().slice(0, 10);
        return getOne(
          'SELECT * FROM budgets WHERE periodType=? AND startDate<=? AND endDate>=? ORDER BY createdAt DESC LIMIT 1',
          [periodType, now, now]
        );
      },
      set(data) {
        const id = uuidv4();
        db.run(
          'INSERT INTO budgets (id, categoryId, periodType, amount, startDate, endDate) VALUES (?,?,?,?,?,?)',
          [id, data.categoryId || null, data.periodType || 'month', data.amount, data.startDate, data.endDate]
        );
        saveToStorage();
        return getOne('SELECT * FROM budgets WHERE id=?', [id]);
      },
    },

    // 撤销/重做
    undo() {
      if (undoStack.length === 0) return null;
      const action = undoStack.pop();
      redoStack.push(action);

      if (action.type === 'create') {
        db.run('DELETE FROM records WHERE id=?', [action.recordId]);
      } else if (action.type === 'update') {
        const d = action.oldData;
        db.run('UPDATE records SET amount=?,type=?,categoryId=?,subcategoryId=?,date=?,note=?,updatedAt=? WHERE id=?',
          [d.amount, d.type, d.categoryId, d.subcategoryId, d.date, d.note, d.updatedAt, d.id]);
      } else if (action.type === 'delete') {
        const d = action.oldData;
        db.run('INSERT INTO records (id,amount,type,categoryId,subcategoryId,date,note,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [d.id, d.amount, d.type, d.categoryId, d.subcategoryId, d.date, d.note, d.createdAt, d.updatedAt]);
      }
      saveToStorage();
      return { actionType: action.type, canUndo: undoStack.length > 0, canRedo: true };
    },
    redo() {
      if (redoStack.length === 0) return null;
      const action = redoStack.pop();
      undoStack.push(action);

      if (action.type === 'create') {
        const d = action.newData;
        db.run('INSERT INTO records (id,amount,type,categoryId,subcategoryId,date,note,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [d.id, d.amount, d.type, d.categoryId, d.subcategoryId, d.date, d.note, d.createdAt, d.updatedAt]);
      } else if (action.type === 'update') {
        const d = action.newData;
        db.run('UPDATE records SET amount=?,type=?,categoryId=?,subcategoryId=?,date=?,note=?,updatedAt=? WHERE id=?',
          [d.amount, d.type, d.categoryId, d.subcategoryId, d.date, d.note, d.updatedAt, d.id]);
      } else if (action.type === 'delete') {
        db.run('DELETE FROM records WHERE id=?', [action.recordId]);
      }
      saveToStorage();
      return { actionType: action.type, canUndo: true, canRedo: redoStack.length > 0 };
    },
    getUndoState() {
      return { canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
    },
  };

  return api;
}

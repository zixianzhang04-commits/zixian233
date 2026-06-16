const { getDatabase } = require('./init');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

// ============ Records ============

function createRecord({ amount, type, categoryId, subcategoryId, date, note }) {
  const db = getDatabase();
  const id = uuidv4();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(
    'INSERT INTO records (id, amount, type, categoryId, subcategoryId, date, note, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(id, amount, type, categoryId, subcategoryId || null, date, note || '', now, now);

  return getRecordById(id);
}

function updateRecord(id, { amount, type, categoryId, subcategoryId, date, note }) {
  const db = getDatabase();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  db.prepare(
    'UPDATE records SET amount=?, type=?, categoryId=?, subcategoryId=?, date=?, note=?, updatedAt=? WHERE id=?'
  ).run(amount, type, categoryId, subcategoryId || null, date, note || '', now, id);

  return getRecordById(id);
}

function deleteRecord(id) {
  const db = getDatabase();
  return db.prepare('DELETE FROM records WHERE id=?').run(id);
}

function getRecordById(id) {
  const db = getDatabase();
  return db.prepare(`
    SELECT r.*, c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor,
           sc.name AS subcategoryName, sc.icon AS subcategoryIcon
    FROM records r
    LEFT JOIN categories c ON r.categoryId=c.id
    LEFT JOIN categories sc ON r.subcategoryId=sc.id
    WHERE r.id=?
  `).get(id);
}

function listRecords({ type, categoryId, startDate, endDate, keyword, page=1, pageSize=50 } = {}) {
  const db = getDatabase();
  const conds = [], params = [];

  if (type)       { conds.push('r.type=?'); params.push(type); }
  if (categoryId) { conds.push('(r.categoryId=? OR r.subcategoryId=?)'); params.push(categoryId, categoryId); }
  if (startDate)  { conds.push('r.date>=?'); params.push(startDate); }
  if (endDate)    { conds.push('r.date<=?'); params.push(endDate); }
  if (keyword)    { conds.push('r.note LIKE ?'); params.push('%'+keyword+'%'); }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const offset = (page - 1) * pageSize;

  const total = db.prepare('SELECT COUNT(*) AS total FROM records r ' + where).get(...params).total;
  const data = db.prepare(`
    SELECT r.*, c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor,
           sc.name AS subcategoryName, sc.icon AS subcategoryIcon
    FROM records r
    LEFT JOIN categories c ON r.categoryId=c.id
    LEFT JOIN categories sc ON r.subcategoryId=sc.id
    ${where} ORDER BY r.date DESC, r.createdAt DESC LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);

  return { total, page, pageSize, data };
}

function copyLastRecord() {
  const db = getDatabase();
  const last = db.prepare('SELECT * FROM records ORDER BY createdAt DESC LIMIT 1').get();
  if (!last) return null;
  const today = new Date().toISOString().slice(0, 10);
  return createRecord({ amount: last.amount, type: last.type, categoryId: last.categoryId, subcategoryId: last.subcategoryId, date: today, note: last.note });
}

// ============ Categories ============

function createCategory({ name, type, icon, color, parentId }) {
  const db = getDatabase();
  const id = uuidv4();
  const row = db.prepare('SELECT MAX(sortOrder) AS m FROM categories WHERE type=? AND parentId IS ?').get(type, parentId || null);
  const sortOrder = ((row && row.m) ?? -1) + 1;

  db.prepare(
    'INSERT INTO categories (id, name, type, icon, color, parentId, sortOrder) VALUES (?,?,?,?,?,?,?)'
  ).run(id, name, type, icon || '', color || '', parentId || null, sortOrder);

  return getCategoryById(id);
}

function updateCategory(id, { name, icon, color }) {
  const db = getDatabase();
  db.prepare('UPDATE categories SET name=?, icon=?, color=? WHERE id=?').run(name, icon||'', color||'', id);
  return getCategoryById(id);
}

function deleteCategory(id) {
  const db = getDatabase();
  const rc = db.prepare('SELECT COUNT(*) AS c FROM records WHERE categoryId=? OR subcategoryId=?').get(id, id);
  const cc = db.prepare('SELECT COUNT(*) AS c FROM categories WHERE parentId=?').get(id);
  return { hasRecords: rc.c > 0, recordCount: rc.c, hasChildren: cc.c > 0, childCount: cc.c, deleted: false };
}

function forceDeleteCategory(id) {
  const db = getDatabase();
  db.prepare('UPDATE records SET categoryId=NULL WHERE categoryId=?').run(id);
  db.prepare('UPDATE records SET subcategoryId=NULL WHERE subcategoryId=?').run(id);
  db.prepare('UPDATE categories SET parentId=NULL WHERE parentId=?').run(id);
  const result = db.prepare('DELETE FROM categories WHERE id=?').run(id);
  return result.changes > 0;
}

function getCategoryById(id) {
  return getDatabase().prepare('SELECT * FROM categories WHERE id=?').get(id);
}

function listCategories(type) {
  if (type) {
    return getDatabase().prepare('SELECT * FROM categories WHERE type=? ORDER BY sortOrder ASC').all(type);
  }
  return getDatabase().prepare('SELECT * FROM categories ORDER BY type, sortOrder ASC').all();
}

function getCategoryTree(type) {
  const all = listCategories(type);
  const parents = all.filter(c => !c.parentId);
  const children = all.filter(c => c.parentId);
  return parents.map(p => ({ ...p, children: children.filter(c => c.parentId === p.id) }));
}

function updateCategoryOrder(id, sortOrder) {
  getDatabase().prepare('UPDATE categories SET sortOrder=? WHERE id=?').run(sortOrder, id);
}

// ============ Budgets ============

function getBudget(periodType='month') {
  const now = new Date().toISOString().slice(0, 10);
  return getDatabase().prepare(
    'SELECT * FROM budgets WHERE periodType=? AND startDate<=? AND endDate>=? ORDER BY createdAt DESC LIMIT 1'
  ).get(periodType, now, now);
}

function setBudget({ categoryId, periodType, amount, startDate, endDate }) {
  const db = getDatabase();
  const id = uuidv4();
  db.prepare(
    'INSERT INTO budgets (id, categoryId, periodType, amount, startDate, endDate) VALUES (?,?,?,?,?,?)'
  ).run(id, categoryId || null, periodType || 'month', amount, startDate, endDate);
  return db.prepare('SELECT * FROM budgets WHERE id=?').get(id);
}

module.exports = {
  createRecord, updateRecord, deleteRecord, getRecordById, listRecords, copyLastRecord,
  createCategory, updateCategory, deleteCategory, forceDeleteCategory, getCategoryById,
  listCategories, getCategoryTree, updateCategoryOrder,
  getBudget, setBudget,
};

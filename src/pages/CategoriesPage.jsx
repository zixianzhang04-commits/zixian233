import React, { useState, useEffect, useCallback } from 'react';
import { useDb } from '../api/db-context';

export default function CategoriesPage() {
  const api = useDb();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [parentForSub, setParentForSub] = useState(null);
  const [deleteCheck, setDeleteCheck] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '' });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.categories.list();
      setCategories(data);
    } catch (err) {
      console.error('加载分类失败:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const expenseAll = categories.filter(c => c.type === 'expense');
  const incomeAll = categories.filter(c => c.type === 'income');

  function buildTree(list) {
    const parents = list.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    const children = list.filter(c => c.parentId);
    return parents.map(p => ({
      ...p,
      children: children.filter(c => c.parentId === p.id).sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editingCat) {
        await api.categories.update(editingCat.id, { name: form.name.trim(), icon: form.icon.trim() });
      } else {
        await api.categories.create({
          name: form.name.trim(), type: form.type, icon: form.icon.trim(),
          parentId: parentForSub ? parentForSub.id : null,
        });
      }
      setShowForm(false); setEditingCat(null); setParentForSub(null);
      setForm({ name: '', type: 'expense', icon: '' });
      loadCategories();
    } catch (err) { console.error('保存分类失败:', err); }
  }

  function handleEdit(cat) {
    setEditingCat(cat); setParentForSub(null);
    setForm({ name: cat.name, type: cat.type, icon: cat.icon || '' });
    setShowForm(true);
  }

  function handleAddSub(parent) {
    setEditingCat(null); setParentForSub(parent);
    setForm({ name: '', type: parent.type, icon: '' });
    setShowForm(true);
  }

  function handleAddTop(type) {
    setEditingCat(null); setParentForSub(null);
    setForm({ name: '', type, icon: '' });
    setShowForm(true);
  }

  async function handleMoveUp(cat) {
    const sameLevel = categories.filter(c => c.parentId === cat.parentId && c.type === cat.type).sort((a,b) => a.sortOrder - b.sortOrder);
    const idx = sameLevel.findIndex(c => c.id === cat.id);
    if (idx <= 0) return;
    const above = sameLevel[idx - 1];
    await api.categories.updateOrder(cat.id, above.sortOrder);
    await api.categories.updateOrder(above.id, cat.sortOrder);
    loadCategories();
  }

  async function handleMoveDown(cat) {
    const sameLevel = categories.filter(c => c.parentId === cat.parentId && c.type === cat.type).sort((a,b) => a.sortOrder - b.sortOrder);
    const idx = sameLevel.findIndex(c => c.id === cat.id);
    if (idx < 0 || idx >= sameLevel.length - 1) return;
    const below = sameLevel[idx + 1];
    await api.categories.updateOrder(cat.id, below.sortOrder);
    await api.categories.updateOrder(below.id, cat.sortOrder);
    loadCategories();
  }

  async function handleDeleteClick(cat) {
    try {
      const result = await api.categories.checkDelete(cat.id);
      setDeleteCheck({ category: cat, ...result });
    } catch (err) { console.error('检查删除失败:', err); }
  }

  async function handleForceDelete() {
    if (!deleteCheck) return;
    try {
      await api.categories.forceDelete(deleteCheck.category.id);
      setDeleteCheck(null);
      loadCategories();
    } catch (err) { console.error('删除分类失败:', err); }
  }

  function renderCategoryRow(cat, isChild) {
    return (
      <div key={cat.id} className={`category-row ${isChild ? 'category-child' : ''}`}>
        <span className="category-card-icon">{cat.icon || '📌'}</span>
        <span className="category-card-name">{cat.name}</span>
        <div className="category-card-actions">
          <button className="btn-icon btn-sort" title="上移" onClick={() => handleMoveUp(cat)}>▲</button>
          <button className="btn-icon btn-sort" title="下移" onClick={() => handleMoveDown(cat)}>▼</button>
          {!cat.parentId && (
            <button className="btn-icon btn-sub" title="添加子分类" onClick={() => handleAddSub(cat)}>+</button>
          )}
          <button className="btn-icon btn-edit" title="编辑" onClick={() => handleEdit(cat)}>✏️</button>
          <button className="btn-icon btn-delete" title="删除" onClick={() => handleDeleteClick(cat)}>🗑️</button>
        </div>
      </div>
    );
  }

  function renderGroup(allCats, type, title) {
    const tree = buildTree(allCats);
    return (
      <div className="category-group">
        <div className="category-group-header">
          <h3>{title}</h3>
          <button className="btn btn-sm btn-primary" onClick={() => handleAddTop(type)}>＋ 添加</button>
        </div>
        {tree.length === 0 ? (
          <p className="empty-hint">暂无{title}分类</p>
        ) : (
          <div className="category-tree">
            {tree.map(parent => (
              <React.Fragment key={parent.id}>
                {renderCategoryRow(parent, false)}
                {parent.children.map(child => renderCategoryRow(child, true))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page">
      {loading ? (
        <div className="loading"><span>加载中...</span></div>
      ) : (
        <div className="categories-container">
          {renderGroup(expenseAll, 'expense', '支出分类')}
          {renderGroup(incomeAll, 'income', '收入分类')}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingCat(null); setParentForSub(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCat ? '编辑分类' : parentForSub ? `添加「${parentForSub.name}」的子分类` : '新增分类'}</h3>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingCat(null); setParentForSub(null); }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {!editingCat && !parentForSub && (
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <div className="toggle-group">
                      <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                        onClick={() => setForm({ ...form, type: 'expense' })}>支出</button>
                      <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active income' : ''}`}
                        onClick={() => setForm({ ...form, type: 'income' })}>收入</button>
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">名称</label>
                  <input type="text" className="form-input" placeholder="分类名称"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus required />
                </div>
                <div className="form-group">
                  <label className="form-label">图标（Emoji）</label>
                  <input type="text" className="form-input" placeholder="例如：🍽️"
                    value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary"
                  onClick={() => { setShowForm(false); setEditingCat(null); setParentForSub(null); }}>取消</button>
                <button type="submit" className="btn btn-primary">
                  {editingCat ? '保存修改' : '添加分类'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCheck && (
        <div className="modal-overlay" onClick={() => setDeleteCheck(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>确认删除分类</h3></div>
            <div className="modal-body">
              <p>分类「{deleteCheck.category.icon} {deleteCheck.category.name}」
                {deleteCheck.hasRecords && <span className="confirm-warning"><br/>有 {deleteCheck.recordCount} 条记录关联此分类，删除后记录的分类将变为空。</span>}
                {deleteCheck.hasChildren && <span className="confirm-warning"><br/>有 {deleteCheck.childCount} 个子分类，删除后子分类将变为一级分类。</span>}
                {!deleteCheck.hasRecords && !deleteCheck.hasChildren && <span className="confirm-safe">没有关联记录，可以安全删除。</span>}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteCheck(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleForceDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

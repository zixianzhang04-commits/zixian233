import React, { useState, useEffect, useCallback } from 'react';
import { useDb } from '../api/db-context';
import PixelIcon from '../components/PixelIcon';

export default function ManagementPage() {
  const api = useDb();
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteCheck, setDeleteCheck] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'expense', icon: '' });

  const loadCategories = useCallback(() => {
    try { setCategories(api.categories.list()); } catch(e) { console.error(e); }
  }, [api]);
  useEffect(() => { if (showCategories) loadCategories(); }, [showCategories, loadCategories]);

  const expenseCats = categories.filter(c => c.type === 'expense' && !c.parentId);
  const incomeCats = categories.filter(c => c.type === 'income' && !c.parentId);

  function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingCat) {
      api.categories.update(editingCat.id, { name: form.name.trim(), icon: form.icon.trim() });
    } else {
      api.categories.create({ name: form.name.trim(), type: form.type, icon: form.icon.trim() });
    }
    setShowForm(false); setEditingCat(null); setForm({ name: '', type: 'expense', icon: '' });
    loadCategories();
  }

  function goBack() { if (typeof window.__setActiveNav === 'function') window.__setActiveNav('profile'); }

  return (
    <div className="page">
      <div className="mgmt-header">
        <button className="btn btn-sm" onClick={goBack}>← 返回</button>
        <h3>我的管理</h3>
      </div>

      {/* 管理菜单 */}
      <div className="profile-section">
        <button className="profile-link-btn" onClick={() => { setShowCategories(!showCategories); if (!showCategories) loadCategories(); }}>
          <PixelIcon name="nav-categories" size={20} />
          <span>分类管理</span>
          <span className="profile-link-arrow">{showCategories ? '▾' : '›'}</span>
        </button>

        {showCategories && (
          <div className="mgmt-cat-panel">
            <div className="profile-section-header" style={{marginTop:12}}>
              <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>支出分类</span>
              <button className="btn btn-sm btn-primary" onClick={() => { setEditingCat(null); setForm({name:'',type:'expense',icon:''}); setShowForm(true); }}>＋</button>
            </div>
            {expenseCats.map(cat => (
              <div key={cat.id} className="mgmt-cat-row">
                <PixelIcon name={cat.icon} size={20} variant="20" /><span>{cat.name}</span>
                <div className="mgmt-cat-actions">
                  <button className="btn-icon btn-edit" onClick={()=>{setEditingCat(cat);setForm({name:cat.name,type:cat.type,icon:cat.icon||''});setShowForm(true);}}><PixelIcon name="action-edit" size={14}/></button>
                  <button className="btn-icon btn-delete" onClick={()=>setDeleteCheck({category:cat,...api.categories.checkDelete(cat.id)})}><PixelIcon name="action-delete" size={14}/></button>
                </div>
              </div>
            ))}
            <div className="profile-section-header" style={{marginTop:16}}>
              <span style={{fontSize:13,color:'var(--color-text-secondary)'}}>收入分类</span>
              <button className="btn btn-sm btn-primary" onClick={() => { setEditingCat(null); setForm({name:'',type:'income',icon:''}); setShowForm(true); }}>＋</button>
            </div>
            {incomeCats.map(cat => (
              <div key={cat.id} className="mgmt-cat-row">
                <PixelIcon name={cat.icon} size={20} variant="20" /><span>{cat.name}</span>
                <div className="mgmt-cat-actions">
                  <button className="btn-icon btn-edit" onClick={()=>{setEditingCat(cat);setForm({name:cat.name,type:cat.type,icon:cat.icon||''});setShowForm(true);}}><PixelIcon name="action-edit" size={14}/></button>
                  <button className="btn-icon btn-delete" onClick={()=>setDeleteCheck({category:cat,...api.categories.checkDelete(cat.id)})}><PixelIcon name="action-delete" size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 分类表单 */}
      {showForm && (
        <div className="modal-overlay" onClick={()=>{setShowForm(false);setEditingCat(null);}}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>{editingCat?'编辑分类':'新增分类'}</h3><button className="modal-close" onClick={()=>{setShowForm(false);setEditingCat(null);}}>✕</button></div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {!editingCat && (
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <div className="toggle-group">
                      <button type="button" className={`toggle-btn ${form.type==='expense'?'active expense':''}`} onClick={()=>setForm({...form,type:'expense'})}>支出</button>
                      <button type="button" className={`toggle-btn ${form.type==='income'?'active income':''}`} onClick={()=>setForm({...form,type:'income'})}>收入</button>
                    </div>
                  </div>
                )}
                <div className="form-group"><label className="form-label">名称</label><input type="text" className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus required /></div>
                <div className="form-group"><label className="form-label">图标名</label><input type="text" className="form-input" placeholder="如 cat-eat" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>{setShowForm(false);setEditingCat(null);}}>取消</button>
                <button type="submit" className="btn btn-primary">{editingCat?'保存':'添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {deleteCheck && (
        <div className="modal-overlay" onClick={()=>setDeleteCheck(null)}>
          <div className="modal confirm-modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>确认删除</h3></div>
            <div className="modal-body">
              <p>删除「{deleteCheck.category.name}」{deleteCheck.hasRecords&&<span className="confirm-warning"><br/>{deleteCheck.recordCount}条关联记录将被取消分类</span>}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setDeleteCheck(null)}>取消</button>
              <button className="btn btn-danger" onClick={()=>{api.categories.forceDelete(deleteCheck.category.id);setDeleteCheck(null);loadCategories();}}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

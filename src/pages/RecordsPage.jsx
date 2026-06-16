import React, { useState, useEffect, useCallback } from 'react';
import { useDb } from '../api/db-context';
import RecordForm from '../components/RecordForm';
import RecordList from '../components/RecordList';
import ImportExport from '../components/ImportExport';

export default function RecordsPage() {
  const api = useDb();
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({ type: '', keyword: '', startDate: '', endDate: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false });
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recordData, catData] = await Promise.all([
        api.records.list(filters),
        api.categories.list(),
      ]);
      setRecords(recordData.data);
      setCategories(catData);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }

  async function handleSave(formData) {
    try {
      if (editingRecord) {
        await api.records.update(editingRecord.id, formData);
      } else {
        await api.records.create(formData);
      }
      setShowForm(false);
      setEditingRecord(null);
      loadData();
      setUndoState(api.getUndoState());
      showToast(editingRecord ? '记录已更新' : '记录已添加');
    } catch (err) { console.error('保存记录失败:', err); }
  }

  function handleEdit(record) { setEditingRecord(record); setShowForm(true); }

  function handleDeleteRequest(record) { setDeleteTarget(record); }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      await api.records.delete(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
      setUndoState(api.getUndoState());
      showToast('记录已删除');
    } catch (err) { console.error('删除记录失败:', err); }
  }

  async function handleCopyLast() {
    try {
      const result = await api.records.copyLast();
      if (result) {
        loadData();
        showToast('已复制上一条记录');
      } else {
        showToast('没有可复制的记录');
      }
    } catch (err) { console.error('复制记录失败:', err); }
  }

  async function handleUndo() {
    const result = await api.undo();
    if (result) {
      loadData();
      setUndoState({ canUndo: result.canUndo, canRedo: result.canRedo });
      const labels = { create: '新增', update: '编辑', delete: '删除' };
      showToast(`已撤销${labels[result.actionType] || ''}操作`);
    }
  }

  async function handleRedo() {
    const result = await api.redo();
    if (result) {
      loadData();
      setUndoState({ canUndo: result.canUndo, canRedo: result.canRedo });
      const labels = { create: '新增', update: '编辑', delete: '删除' };
      showToast(`已重做${labels[result.actionType] || ''}操作`);
    }
  }

  return (
    <div className="page">
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn btn-primary" onClick={() => { setEditingRecord(null); setShowForm(true); }}>＋ 新增记录</button>
          <button className="btn btn-secondary" onClick={handleCopyLast}>📋 快速复制上一条</button>
          <button className="btn btn-secondary" onClick={handleUndo} disabled={!undoState.canUndo} title="撤销 (Ctrl+Z)">↩️ 撤销</button>
          <button className="btn btn-secondary" onClick={handleRedo} disabled={!undoState.canRedo} title="重做 (Ctrl+Y)">↪️ 重做</button>
          <ImportExport records={records} categories={categories} onDataChanged={loadData} />
        </div>
        <div className="toolbar-right">
          <select className="form-input filter-select" value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}>
            <option value="">全部类型</option>
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
          <input type="date" className="form-input filter-date" value={filters.startDate}
            onChange={e => setFilters({ ...filters, startDate: e.target.value })} title="开始日期" />
          <input type="date" className="form-input filter-date" value={filters.endDate}
            onChange={e => setFilters({ ...filters, endDate: e.target.value })} title="结束日期" />
          <input type="text" className="form-input filter-input" placeholder="搜索备注..."
            value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
        </div>
      </div>

      {/* 列表 */}
      {loading ? <div className="loading"><span>加载中...</span></div> : (
        <>
          <RecordList records={records} onEdit={handleEdit} onDelete={handleDeleteRequest} />
          {records.length > 0 && (
            <div className="record-summary">
              共 {records.length} 条记录
            </div>
          )}
        </>
      )}

      {/* 新增/编辑弹窗 */}
      {showForm && (
        <RecordForm record={editingRecord} categories={categories}
          onSave={handleSave} onCancel={() => { setShowForm(false); setEditingRecord(null); }} />
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>确认删除</h3></div>
            <div className="modal-body">
              <p>确定要删除这条记录吗？</p>
              <div className="confirm-detail">
                <span className={`type-badge ${deleteTarget.type}`}>{deleteTarget.type === 'income' ? '收入' : '支出'}</span>
                <strong>{deleteTarget.type === 'income' ? '+' : '-'}¥{Number(deleteTarget.amount).toFixed(2)}</strong>
                <span> — {deleteTarget.categoryName}</span>
                <span className="confirm-date">({deleteTarget.date})</span>
              </div>
              <p className="confirm-warning">此操作可撤销。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    } catch (err) { console.error('删除记录失败:', err); }
  }

  return (
    <div className="page">
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn btn-primary" onClick={() => { setEditingRecord(null); setShowForm(true); }}>添一笔</button>
          <select className="form-input filter-select" value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}>
            <option value="">全部</option>
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
          <ImportExport records={records} categories={categories} onDataChanged={loadData} />
        </div>
        <div className="toolbar-right">
          <input type="text" className="form-input filter-search" placeholder="搜索备注…"
            value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
          <div className="date-filter-wrap">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowDatePicker(!showDatePicker)}>
              📅 {filters.startDate || filters.endDate
                ? `${(filters.startDate || '…').replace(/-/g,'/')} ~ ${(filters.endDate || '…').replace(/-/g,'/')}`
                : '选择日期'}
            </button>
            {showDatePicker && (
              <div className="modal-overlay" onClick={() => setShowDatePicker(false)}>
                <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>选择日期范围</h3>
                    <button className="modal-close" onClick={() => setShowDatePicker(false)}>✕</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">开始日期</label>
                      <input type="date" className="form-input" value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">结束日期</label>
                      <input type="date" className="form-input" value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary btn-sm" onClick={() => { setFilters({ ...filters, startDate: '', endDate: '' }); setShowDatePicker(false); }}>清除</button>
                    <button className="btn btn-primary" onClick={() => setShowDatePicker(false)}>确定</button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              <p className="confirm-warning">此操作不可撤销。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>确认删除</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

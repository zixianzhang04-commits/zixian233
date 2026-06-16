import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDb } from '../api/db-context';
import PixelIcon from '../components/PixelIcon';
import RecordForm from '../components/RecordForm';
import RecordList from '../components/RecordList';
import ImportExport from '../components/ImportExport';

export default function RecordsPage() {
  const api = useDb();
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pullStart = useRef(0);
  const pullEl = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({ type: '', keyword: '', startDate: '', endDate: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);

  async function doRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  function onTouchStart(e) {
    if (pullEl.current && pullEl.current.scrollTop <= 0) pullStart.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (pullStart.current && e.touches[0].clientY - pullStart.current > 80 && !refreshing) {
      doRefresh(); pullStart.current = 0;
    }
  }

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

  function fmtDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${y}年${parseInt(m)}月${parseInt(day)}日`;
  }

  const hasBothDates = filters.startDate && filters.endDate;

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
    <div className="page" ref={pullEl} onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
      {refreshing && <div className="pull-indicator">⟳ 刷新中…</div>}
      {/* 工具栏 */}
      <div className="toolbar">
        <div className="toolbar-left">
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
              <PixelIcon name="misc-calendar" size={14} /> {filters.startDate || filters.endDate
                ? `${fmtDate(filters.startDate) || '…'} ~ ${fmtDate(filters.endDate) || '…'}`
                : '选择日期'}
            </button>
            {showDatePicker && (
              <div className="date-overlay" onClick={() => setShowDatePicker(false)}>
                <div className="date-panel" onClick={e => e.stopPropagation()}>
                  <div className="date-panel-header">
                    <h4>选择日期</h4>
                  </div>
                  <div className="date-panel-body">
                    <label className="form-label">开始日期</label>
                    <input type="date" className="form-input" value={filters.startDate}
                      onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    <label className="form-label">结束日期</label>
                    <input type="date" className="form-input" value={filters.endDate}
                      onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                  </div>
                  <div className="date-panel-actions">
                    <button className="btn btn-sm" disabled={!hasBothDates} onClick={() => { setFilters({ ...filters, startDate: '', endDate: '' }); setShowDatePicker(false); }}>清除</button>
                    <button className="btn btn-primary btn-sm" disabled={!hasBothDates} onClick={() => setShowDatePicker(false)}>确定</button>
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
          <RecordList records={records} onEdit={handleEdit} onDelete={handleDeleteRequest} onDetail={setDetailRecord} />
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

      {/* 查看详情弹窗 */}
      {detailRecord && (
        <div className="modal-overlay" onClick={() => { setDetailRecord(null); setZoomImg(null); }}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>记录详情</h3>
              <button className="modal-close" onClick={() => { setDetailRecord(null); setZoomImg(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">金额</span><span className={`detail-value ${detailRecord.type}`}>{detailRecord.type==='income'?'+':'-'}¥{Number(detailRecord.amount).toFixed(2)}</span></div>
                <div className="detail-item"><span className="detail-label">类型</span><span className="detail-value">{detailRecord.type==='income'?'收入':'支出'}</span></div>
                <div className="detail-item"><span className="detail-label">分类</span><span className="detail-value"><PixelIcon name={detailRecord.categoryIcon} size={16} /> {detailRecord.categoryName}{detailRecord.subcategoryName?' / '+detailRecord.subcategoryName:''}</span></div>
                <div className="detail-item"><span className="detail-label">日期</span><span className="detail-value">{detailRecord.date}</span></div>
                <div className="detail-item"><span className="detail-label">备注</span><span className="detail-value">{detailRecord.note || '-'}</span></div>
              </div>
              {(() => { try { const imgs=JSON.parse(detailRecord.images||'[]'); return imgs.length>0; } catch{return false} })() && (
                <div className="detail-images">
                  <div className="detail-label" style={{marginBottom:8}}>图片</div>
                  <div className="detail-image-list">
                    {(JSON.parse(detailRecord.images||'[]')).map((img,i) => (
                      <img key={i} src={img} alt="" className="detail-thumb" onClick={() => setZoomImg(img)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 图片放大 */}
      {zoomImg && (
        <div className="zoom-overlay" onClick={() => setZoomImg(null)}>
          <img src={zoomImg} alt="" className="zoom-img" onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
}

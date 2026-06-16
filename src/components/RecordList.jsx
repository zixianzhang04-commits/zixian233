import React, { useState, useRef } from 'react';
import PixelIcon from './PixelIcon';

function formatAmount(amount, type) {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
}

function SwipeRow({ record, onDelete, onEdit, onDetail }) {
  const [swiped, setSwiped] = useState(false);
  const startX = useRef(0);

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = startX.current - e.changedTouches[0].clientX;
    setSwiped(dx > 70);
  };

  return (
    <tr className={`swipe-row ${swiped?'swiped':''} record-${record.type}`}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {swiped && <td colSpan={6} className="swipe-delete-cell"><button className="btn btn-danger btn-sm" onClick={()=>{onDelete(record);setSwiped(false);}}>确认删除</button><button className="btn btn-sm" onClick={()=>setSwiped(false)}>取消</button></td>}
      {!swiped && (
        <>
          <td className="col-date">{record.date}</td>
          <td className="col-type"><span className={`type-badge ${record.type}`}>{record.type==='income'?'收入':'支出'}</span></td>
          <td className="col-category"><span className="category-name">{record.categoryIcon && <span className="cat-icon"><PixelIcon name={record.categoryIcon} size={16}/></span>}{record.categoryName}{record.subcategoryName && <span className="subcategory-name"> / {record.subcategoryName}</span>}</span></td>
          <td className={`col-amount amount-${record.type}`}>{formatAmount(record.amount, record.type)}</td>
          <td className="col-note"><span className="note-text" title={record.note}>{record.note||'-'}</span></td>
          <td className="col-actions">
            <button className="btn-icon" title="详情" onClick={()=>onDetail(record)}><PixelIcon name="action-detail"/></button>
            <button className="btn-icon btn-edit" title="编辑" onClick={()=>onEdit(record)}><PixelIcon name="action-edit"/></button>
            <button className="btn-icon btn-delete" title="删除" onClick={()=>onDelete(record)}><PixelIcon name="action-delete"/></button>
          </td>
        </>
      )}
    </tr>
  );
}

export default function RecordList({ records, onEdit, onDelete, onDetail }) {
  if (!records || records.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📭</span>
        <p>暂无记录</p>
        <p className="empty-hint">点击上方按钮添加第一条记录吧</p>
      </div>
    );
  }

  return (
    <div className="record-list">
      <table className="table">
        <thead>
          <tr>
            <th className="col-date">日期</th>
            <th className="col-type">类型</th>
            <th className="col-category">分类</th>
            <th className="col-amount">金额</th>
            <th className="col-note">备注</th>
            <th className="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <SwipeRow key={record.id} record={record} onDelete={onDelete} onEdit={onEdit} onDetail={onDetail} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

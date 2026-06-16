import React from 'react';

function formatAmount(amount, type) {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
}

export default function RecordList({ records, onEdit, onDelete }) {
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
            <tr key={record.id} className={`record-row record-${record.type}`}>
              <td className="col-date">{record.date}</td>
              <td className="col-type">
                <span className={`type-badge ${record.type}`}>
                  {record.type === 'income' ? '收入' : '支出'}
                </span>
              </td>
              <td className="col-category">
                <span className="category-name">
                  {record.categoryIcon && <span className="cat-icon">{record.categoryIcon}</span>}
                  {record.categoryName}
                  {record.subcategoryName && (
                    <span className="subcategory-name"> / {record.subcategoryName}</span>
                  )}
                </span>
              </td>
              <td className={`col-amount amount-${record.type}`}>
                {formatAmount(record.amount, record.type)}
              </td>
              <td className="col-note">
                <span className="note-text" title={record.note}>
                  {record.note || '-'}
                </span>
              </td>
              <td className="col-actions">
                <button
                  className="btn-icon btn-edit"
                  title="编辑"
                  onClick={() => onEdit(record)}
                >
                  ✏️
                </button>
                <button
                  className="btn-icon btn-delete"
                  title="删除"
                  onClick={() => onDelete(record)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

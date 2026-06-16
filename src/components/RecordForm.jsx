import React, { useState, useEffect } from 'react';

const emptyForm = {
  amount: '',
  type: 'expense',
  categoryId: '',
  subcategoryId: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
};

export default function RecordForm({ record, categories, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (record) {
      setForm({
        amount: record.amount || '',
        type: record.type || 'expense',
        categoryId: record.categoryId || '',
        subcategoryId: record.subcategoryId || '',
        date: record.date || new Date().toISOString().slice(0, 10),
        note: record.note || '',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [record]);

  const parentCategories = categories.filter((c) => !c.parentId && c.type === form.type);
  const subCategories = categories.filter(
    (c) => c.parentId === form.categoryId
  );

  function validate() {
    const err = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      err.amount = '请输入有效的金额';
    }
    if (!form.categoryId) {
      err.categoryId = '请选择分类';
    }
    if (!form.date) {
      err.date = '请选择日期';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      amount: Number(form.amount),
      subcategoryId: form.subcategoryId || null,
    });
  }

  function handleTypeChange(type) {
    setForm({ ...form, type, categoryId: '', subcategoryId: '' });
  }

  function updateField(field, value) {
    const updates = { ...form, [field]: value };
    if (field === 'categoryId') {
      updates.subcategoryId = '';
    }
    setForm(updates);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{record ? '编辑记录' : '新增记录'}</h3>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 类型切换 */}
            <div className="form-group">
              <label className="form-label">类型</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                  onClick={() => handleTypeChange('expense')}
                >
                  支出
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${form.type === 'income' ? 'active income' : ''}`}
                  onClick={() => handleTypeChange('income')}
                >
                  收入
                </button>
              </div>
            </div>

            {/* 金额 */}
            <div className="form-group">
              <label className="form-label">金额</label>
              <input
                type="number"
                className={`form-input ${errors.amount ? 'is-error' : ''}`}
                placeholder="0.00"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                autoFocus
              />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>

            {/* 分类 */}
            <div className="form-group">
              <label className="form-label">分类</label>
              <select
                className={`form-input ${errors.categoryId ? 'is-error' : ''}`}
                value={form.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
              >
                <option value="">请选择分类</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
            </div>

            {/* 子分类 */}
            {subCategories.length > 0 && (
              <div className="form-group">
                <label className="form-label">子分类（可选）</label>
                <select
                  className="form-input"
                  value={form.subcategoryId}
                  onChange={(e) => updateField('subcategoryId', e.target.value)}
                >
                  <option value="">不选</option>
                  {subCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 日期 */}
            <div className="form-group">
              <label className="form-label">日期</label>
              <input
                type="date"
                className={`form-input ${errors.date ? 'is-error' : ''}`}
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
              />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>

            {/* 备注 */}
            <div className="form-group">
              <label className="form-label">备注（可选）</label>
              <input
                type="text"
                className="form-input"
                placeholder="添加备注..."
                value={form.note}
                onChange={(e) => updateField('note', e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              {record ? '保存修改' : '添加记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

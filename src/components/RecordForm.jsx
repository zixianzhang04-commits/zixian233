import React, { useState, useEffect } from 'react';
import PixelIcon from './PixelIcon';

const emptyForm = {
  amount: '',
  type: 'expense',
  categoryId: '',
  subcategoryId: '',
  date: new Date().toISOString().slice(0, 10),
  note: '',
  images: '[]',
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
        images: record.images || '[]',
      });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [record]);

  const parentCategories = categories.filter((c) => !c.parentId && c.type === form.type);

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
    setForm({ ...form, type, categoryId: '' });
  }

  function updateField(field, value) {
    setForm({ ...form, [field]: value });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{record ? '编辑记录' : '添一笔'}</h3>
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
              <div className="category-card-grid">
                {parentCategories.map(cat => (
                  <div key={cat.id}
                    className={`category-card-item ${form.categoryId === cat.id ? 'selected' : ''}`}
                    onClick={() => updateField('categoryId', cat.id)}>
                    <PixelIcon name={cat.icon} size={48} variant="64" />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
              {errors.categoryId && <span className="form-error">{errors.categoryId}</span>}
            </div>

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

            {/* 添加图片 */}
            <div className="form-group">
              <label className="form-label">图片（可选，可多张）</label>
              <div className="image-list">
                {(JSON.parse(form.images || '[]')).map((img, i) => (
                  <div key={i} className="image-thumb">
                    <img src={img} alt="" />
                    <button type="button" className="image-remove" onClick={() => {
                      const list = JSON.parse(form.images || '[]');
                      list.splice(i, 1);
                      updateField('images', JSON.stringify(list));
                    }}>✕</button>
                  </div>
                ))}
                <label className="image-upload-btn">
                  ＋
                  <input type="file" accept="image/*" hidden
                    onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 2*1024*1024) { alert('图片不能超过 2MB'); return; }
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const img = new Image();
                        img.onload = () => {
                          const maxW = 400;
                          const scale = Math.min(1, maxW / img.width);
                          const w = Math.round(img.width * scale);
                          const h = Math.round(img.height * scale);
                          const canvas = document.createElement('canvas');
                          canvas.width = w; canvas.height = h;
                          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                          const compressed = canvas.toDataURL('image/jpeg', 0.5);
                          const list = JSON.parse(form.images || '[]');
                          list.push(compressed);
                          updateField('images', JSON.stringify(list));
                        };
                        img.src = ev.target.result;
                      };
                      reader.readAsDataURL(file);
                    }} />
                </label>
              </div>
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

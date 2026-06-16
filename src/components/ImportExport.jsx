import React, { useState } from 'react';
import { useDb } from '../api/db-context';
import PixelIcon from './PixelIcon';
import { exportCSV, exportExcel, exportBackup, parseCSV, parseExcel, detectFieldMapping, validateAndConvert, parseBackup, importRecords } from '../api/backup';

export default function ImportExport({ records, categories, onDataChanged }) {
  const api = useDb();
  const [showMenu, setShowMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [errors, setErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  // ====== 导出 ======
  function handleExportCSV() {
    exportCSV(records, categories);
    setShowMenu(false);
  }
  async function handleExportExcel() {
    await exportExcel(records, categories);
    setShowMenu(false);
  }
  function handleExportBackup() {
    const budgets = []; // budgets from api
    exportBackup(records, categories, budgets);
    setShowMenu(false);
  }

  // ====== 导入 ======
  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    try {
      let parsed;
      if (file.name.endsWith('.csv')) {
        const text = await readFileAsText(file);
        parsed = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsed = await parseExcel(file);
      } else {
        alert('请选择 CSV 或 Excel 文件');
        setImportLoading(false);
        return;
      }

      const mapping = detectFieldMapping(parsed.headers);
      const { valid, errors } = validateAndConvert(parsed.rows, mapping, categories);

      setPreview(parsed);
      setFieldMapping(mapping);
      setErrors(errors);
      setShowImport(true);
    } catch (err) {
      alert('文件解析失败：' + err.message);
    }
    setImportLoading(false);
    e.target.value = '';
  }

  async function handleConfirmImport() {
    const { valid } = validateAndConvert(preview.rows, fieldMapping, categories);
    const count = await importRecords(api, valid);
    alert(`导入完成：成功 ${count} 条，跳过 ${errors.length} 条`);
    setShowImport(false);
    setPreview(null);
    onDataChanged();
  }

  // ====== 恢复备份 ======
  async function handleRestoreSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const backup = await parseBackup(file);
      setPreview(backup);
      setShowRestore(true);
    } catch (err) {
      alert('备份文件无效：' + err.message);
    }
    e.target.value = '';
  }

  async function handleConfirmRestore() {
    if (!window.confirm('恢复备份将替换当前所有数据，确定继续？')) return;
    // 清空 + 导入
    const { data } = preview;
    localStorage.clear();

    // 重新初始化数据库
    const { createBrowserDb, getApi } = await import('../api/browser-db');
    await createBrowserDb();
    const newApi = getApi();

    // 导入所有数据
    for (const cat of (data.categories || [])) {
      try { await newApi.categories.create(cat); } catch (e) {}
    }
    for (const rec of (data.records || [])) {
      try { await newApi.records.create(rec); } catch (e) {}
    }
    alert('备份恢复完成，请刷新页面');
    window.location.reload();
  }

  return (
    <>
      {/* 导出按钮组 */}
      <div className="dropdown" style={{ position: 'relative', display: 'inline-block' }}>
        <button className="btn btn-secondary" onClick={() => setShowMenu(!showMenu)}>
          <PixelIcon name="io-export" size={14} /> 导入/导出 ▾
        </button>
        {showMenu && (
          <div className="dropdown-menu">
            <button onClick={handleExportCSV}><PixelIcon name="io-csv" size={14} /> 导出 CSV</button>
            <button onClick={handleExportExcel}><PixelIcon name="io-excel" size={14} /> 导出 Excel</button>
            <button onClick={handleExportBackup}><PixelIcon name="io-backup" size={14} /> 备份数据 (JSON)</button>
            <hr />
            <label className="dropdown-file-btn">
              <PixelIcon name="io-import" size={14} /> 导入 CSV / Excel
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} hidden />
            </label>
            <label className="dropdown-file-btn">
              <PixelIcon name="io-restore" size={14} /> 恢复备份
              <input type="file" accept=".json" onChange={handleRestoreSelect} hidden />
            </label>
          </div>
        )}
      </div>

      {/* 遮罩关闭 */}
      {showMenu && <div className="dropdown-backdrop" onClick={() => setShowMenu(false)} />}

      {/* 导入预览弹窗 */}
      {showImport && preview && (
        <div className="modal-overlay" onClick={() => setShowImport(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>导入预览</h3>
              <button className="modal-close" onClick={() => setShowImport(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="import-summary">
                解析到 {preview.rows.length} 条数据，{errors.length} 条有误
              </div>
              {errors.length > 0 && (
                <div className="import-errors">
                  {errors.map((e, i) => (
                    <div key={i} className="import-error-item">
                      第 {e.line} 行：{e.errors.join('，')}
                    </div>
                  ))}
                </div>
              )}
              <div className="import-preview-table">
                <table className="table">
                  <thead>
                    <tr>
                      {preview.headers.map((h, i) => (
                        <th key={i}>{h} {fieldMapping.amount === i && '→金额'} {fieldMapping.type === i && '→类型'} {fieldMapping.category === i && '→分类'} {fieldMapping.subcategory === i && '→子分类'} {fieldMapping.date === i && '→日期'} {fieldMapping.note === i && '→备注'}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((row, i) => {
                      const errLines = errors.filter(e => e.line === i + 2);
                      return (
                        <tr key={i} className={errLines.length > 0 ? 'row-error' : ''}>
                          {row.map((cell, j) => <td key={j}>{String(cell)}</td>)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowImport(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmImport}>确认导入</button>
            </div>
          </div>
        </div>
      )}

      {/* 恢复备份弹窗 */}
      {showRestore && preview && (
        <div className="modal-overlay" onClick={() => setShowRestore(false)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>恢复备份</h3></div>
            <div className="modal-body">
              <p>备份信息：</p>
              <div className="confirm-detail">
                <div>导出时间：{preview.exportedAt}</div>
                <div>记录数：{preview.counts?.records || '?'}</div>
                <div>分类数：{preview.counts?.categories || '?'}</div>
              </div>
              <p className="confirm-warning">恢复将替换当前所有数据！</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRestore(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleConfirmRestore}>确认恢复</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

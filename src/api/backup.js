/**
 * 数据导入导出与备份恢复工具
 * 浏览器端使用：通过 DB_STORAGE_KEY 访问 localStorage 中的 sql.js 数据
 */

const DB_STORAGE_KEY = 'ledger_db_data';

// ==================== 导出 ====================

/** 导出 CSV */
export function exportCSV(records, categories) {
  const headers = ['金额', '类型', '分类', '子分类', '日期', '备注'];
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const rows = records.map(r => {
    const cat = catMap[r.categoryId];
    const sub = catMap[r.subcategoryId];
    return [
      (r.type === 'income' ? '+' : '-') + Number(r.amount).toFixed(2),
      r.type === 'income' ? '收入' : '支出',
      cat ? cat.name : '',
      sub ? sub.name : '',
      r.date,
      r.note || '',
    ];
  });

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  downloadFile(csv, `记账记录_${today()}.csv`, 'text/csv;charset=utf-8');
}

/** 导出 Excel (.xlsx) */
export async function exportExcel(records, categories) {
  const XLSX = await import('xlsx');
  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  const data = records.map(r => {
    const cat = catMap[r.categoryId];
    const sub = catMap[r.subcategoryId];
    return {
      '金额': (r.type === 'income' ? '+' : '-') + Number(r.amount).toFixed(2),
      '类型': r.type === 'income' ? '收入' : '支出',
      '分类': cat ? cat.name : '',
      '子分类': sub ? sub.name : '',
      '日期': r.date,
      '备注': r.note || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '记账记录');
  XLSX.writeFile(wb, `记账记录_${today()}.xlsx`);
}

/** 导出完整备份 (JSON) */
export function exportBackup(records, categories, budgets) {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    counts: { records: records.length, categories: categories.length, budgets: budgets.length },
    data: { records, categories, budgets },
  };
  downloadFile(JSON.stringify(backup, null, 2), `记账备份_${today()}.json`, 'application/json');
}

// ==================== 导入解析 ====================

/** 解析 CSV 文件内容 */
export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseCSVLine(lines[i]));
  }
  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

/** 解析 Excel 文件 */
export async function parseExcel(file) {
  const XLSX = await import('xlsx');
  const data = await readFileAsArrayBuffer(file);
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (json.length === 0) return { headers: [], rows: [] };
  return { headers: json[0].map(String), rows: json.slice(1) };
}

/** 自动字段映射 */
export function detectFieldMapping(headers) {
  const mapping = {};
  const lower = headers.map(h => String(h).toLowerCase().trim());

  const patterns = {
    amount: ['金额', 'amount', '数目', '价格', 'price', '钱', '元'],
    type: ['类型', 'type', '收支', '分类类型', 'kind'],
    category: ['分类', 'category', '类别', 'cat', '大类'],
    subcategory: ['子分类', 'subcategory', '子类别', 'sub', 'subcat'],
    date: ['日期', 'date', '时间', 'time'],
    note: ['备注', 'note', '说明', 'remark', '描述', 'desc', 'memo'],
  };

  for (const [field, keywords] of Object.entries(patterns)) {
    for (const kw of keywords) {
      const idx = lower.findIndex(h => h.includes(kw.toLowerCase()));
      if (idx >= 0) { mapping[field] = idx; break; }
    }
  }
  return mapping;
}

/** 校验并转换导入数据 */
export function validateAndConvert(rows, fieldMapping, categories) {
  const catMap = {};
  categories.forEach(c => { catMap[c.name] = c; });

  const valid = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // +2: header + 1-based
    const lineErrors = [];

    const amountIdx = fieldMapping.amount;
    const typeIdx = fieldMapping.type;
    const catIdx = fieldMapping.category;
    const subcatIdx = fieldMapping.subcategory;
    const dateIdx = fieldMapping.date;
    const noteIdx = fieldMapping.note;

    // 金额
    let amount = null;
    if (amountIdx !== undefined && row[amountIdx] !== undefined) {
      const raw = String(row[amountIdx]).replace(/[+¥,￥\s]/g, '');
      amount = parseFloat(raw);
      if (isNaN(amount) || amount <= 0) lineErrors.push('金额无效');
    } else { lineErrors.push('缺少金额'); }

    // 类型
    let type = 'expense';
    if (typeIdx !== undefined && row[typeIdx] !== undefined) {
      const raw = String(row[typeIdx]).trim();
      if (raw.includes('收入') || raw.toLowerCase().includes('income')) type = 'income';
      else if (raw.includes('支出') || raw.toLowerCase().includes('expense')) type = 'expense';
    }

    // 分类
    let categoryId = null;
    let subcategoryId = null;
    if (catIdx !== undefined && row[catIdx] !== undefined) {
      const catName = String(row[catIdx]).trim();
      const cat = catMap[catName];
      if (cat) {
        categoryId = cat.id;
        if (subcatIdx !== undefined && row[subcatIdx] !== undefined) {
          const subName = String(row[subcatIdx]).trim();
          const sub = categories.find(c => c.name === subName && c.parentId === cat.id);
          if (sub) subcategoryId = sub.id;
        }
      } else {
        lineErrors.push(`分类「${catName}」不存在`);
      }
    }

    // 日期
    let date = new Date().toISOString().slice(0, 10);
    if (dateIdx !== undefined && row[dateIdx] !== undefined) {
      const raw = String(row[dateIdx]).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        date = raw;
      } else if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(raw)) {
        const parts = raw.split('/');
        date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        lineErrors.push('日期格式无效（需 YYYY-MM-DD）');
      }
    }

    // 备注
    let note = '';
    if (noteIdx !== undefined && row[noteIdx] !== undefined) {
      note = String(row[noteIdx]).trim();
    }

    if (lineErrors.length > 0) {
      errors.push({ line: lineNum, errors: lineErrors, raw: row });
    } else if (amount !== null && categoryId) {
      valid.push({ amount: Math.abs(amount), type, categoryId, subcategoryId, date, note });
    }
  }

  return { valid, errors };
}

/** 解析备份 JSON 文件 */
export async function parseBackup(file) {
  const text = await readFileAsText(file);
  const backup = JSON.parse(text);
  if (!backup.data || !backup.data.records) throw new Error('无效的备份文件格式');
  return backup;
}

// ==================== 工具 ====================

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob(['﻿' + content], { type: mimeType }); // BOM for Excel compatibility
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 批量导入记录到数据库 */
export async function importRecords(api, records) {
  let success = 0;
  for (const r of records) {
    try {
      await api.records.create(r);
      success++;
    } catch (e) {
      console.error('导入失败:', r, e);
    }
  }
  return success;
}

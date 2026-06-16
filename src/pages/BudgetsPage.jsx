import React, { useState, useEffect, useCallback } from 'react';
import { useDb } from '../api/db-context';

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export default function BudgetsPage() {
  const api = useDb();
  const [records, setRecords] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', periodType: 'month' });

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const loadData = useCallback(async () => {
    try {
      const [recData, bgt] = await Promise.all([
        api.records.list({ pageSize: 9999 }),
        api.budgets.get('month'),
      ]);
      setRecords(recData.data);
      setBudget(bgt);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { loadData(); }, [loadData]);

  // 本月支出
  const monthExpense = records
    .filter(r => r.date.startsWith(thisMonth) && r.type === 'expense')
    .reduce((s, r) => s + r.amount, 0);

  const budgetAmount = budget ? budget.amount : 0;
  const percent = budgetAmount > 0 ? Math.round((monthExpense / budgetAmount) * 100) : 0;
  const remaining = budgetAmount - monthExpense;
  const isOverBudget = budgetAmount > 0 && monthExpense > budgetAmount;

  async function handleSetBudget(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    const firstDay = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0, 10);
    await api.budgets.set({
      periodType: 'month',
      amount: Number(form.amount),
      startDate: firstDay,
      endDate: lastDay,
    });
    setShowForm(false);
    loadData();
  }

  if (loading) return <div className="page"><div className="loading"><span>加载中...</span></div></div>;

  return (
    <div className="page">
      {/* 预算总览卡片 */}
      <div className="budget-overview">
        <div className="budget-header-row">
          <h3>{MONTHS[now.getMonth()]}预算</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowForm(true)}>
            {budget ? '修改预算' : '设置预算'}
          </button>
        </div>

        {budget ? (
          <>
            <div className="budget-numbers">
              <div className="budget-num">
                <span className="budget-num-label">预算</span>
                <span className="budget-num-value">¥{budgetAmount.toFixed(2)}</span>
              </div>
              <div className="budget-num">
                <span className="budget-num-label">已用</span>
                <span className="budget-num-value expense">¥{monthExpense.toFixed(2)}</span>
              </div>
              <div className={`budget-num ${remaining < 0 ? 'negative' : 'positive'}`}>
                <span className="budget-num-label">{remaining < 0 ? '超支' : '剩余'}</span>
                <span className="budget-num-value">¥{Math.abs(remaining).toFixed(2)}</span>
              </div>
            </div>
            <div className="budget-bar-track">
              <div
                className={`budget-bar-fill ${isOverBudget ? 'over' : percent > 80 ? 'warn' : 'ok'}`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
              {isOverBudget && <div className="budget-bar-over" style={{ width: `${percent - 100}%` }} />}
            </div>
            <div className="budget-bar-label">
              {percent}% 已使用
              {isOverBudget && <span className="budget-warning"> ⚠️ 已超预算！</span>}
              {!isOverBudget && percent > 80 && <span className="budget-warning"> ⚡ 即将超预算</span>}
            </div>
          </>
        ) : (
          <div className="empty-hint" style={{padding: 30}}>
            尚未设置月度预算，点击「设置预算」开始
          </div>
        )}
      </div>

      {/* 设置预算弹窗 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{budget ? '修改预算' : '设置月度预算'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSetBudget}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">预算金额</label>
                  <input type="number" className="form-input" placeholder="例如：5000" step="0.01" min="0"
                    value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} autoFocus required />
                </div>
                <p className="empty-hint">预算周期：{MONTHS[now.getMonth()]}（当月）</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存预算</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

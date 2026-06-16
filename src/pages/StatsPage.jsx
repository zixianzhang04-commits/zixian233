import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../api/db-context';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4a90e2','#e65a5a','#4caf50','#ff9800','#9c27b0','#00bcd4','#795548','#607d8b','#ff5722','#2196f3','#e91e63','#009688','#cddc39'];

export default function StatsPage() {
  const api = useDb();
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const recData = await api.records.list({ pageSize: 9999 });
        const catData = await api.categories.list();
        setRecords(recData.data);
        setCategories(catData);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [api]);

  const catMap = useMemo(() => {
    const m = {}; categories.forEach(c => { m[c.id] = c; }); return m;
  }, [categories]);

  // 本月摘要
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthRecords = records.filter(r => r.date.startsWith(thisMonth));
  const monthIncome = monthRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const monthExpense = monthRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

  // 饼图：本月支出分类占比
  const pieData = useMemo(() => {
    const map = {};
    monthRecords.filter(r => r.type === 'expense').forEach(r => {
      const name = (catMap[r.categoryId] || {}).name || '其他';
      map[name] = (map[name] || 0) + r.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value*100)/100 }));
  }, [monthRecords, catMap]);

  // 折线图：近 N 天趋势
  const lineData = useMemo(() => {
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRecs = records.filter(r => r.date === key);
      days.push({
        date: key.slice(5),
        income: dayRecs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0),
        expense: dayRecs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      });
    }
    return days;
  }, [records, range]);

  if (loading) return <div className="page"><div className="loading"><span>加载中...</span></div></div>;

  return (
    <div className="page">
      {/* 摘要卡片 */}
      <div className="stats-cards">
        <div className="stat-card income">
          <div className="stat-label">本月收入</div>
          <div className="stat-value">¥{monthIncome.toFixed(2)}</div>
        </div>
        <div className="stat-card expense">
          <div className="stat-label">本月支出</div>
          <div className="stat-value">¥{monthExpense.toFixed(2)}</div>
        </div>
        <div className={`stat-card ${monthIncome - monthExpense >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-label">本月结余</div>
          <div className="stat-value">¥{(monthIncome - monthExpense).toFixed(2)}</div>
        </div>
      </div>

      {/* 图表区 */}
      <div className="charts-grid">
        {/* 饼图 */}
        <div className="chart-box">
          <h3>支出分类占比（本月）</h3>
          {pieData.length === 0 ? (
            <div className="empty-hint" style={{padding:40}}>本月暂无支出数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `¥${v}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 折线图 */}
        <div className="chart-box">
          <div className="chart-header">
            <h3>收支趋势</h3>
            <div className="chart-tabs">
              <button className={`chart-tab ${range===7?'active':''}`} onClick={()=>setRange(7)}>7天</button>
              <button className={`chart-tab ${range===30?'active':''}`} onClick={()=>setRange(30)}>30天</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={v => `¥${v}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4caf50" name="收入" strokeWidth={2} dot={range===7} />
              <Line type="monotone" dataKey="expense" stroke="#e65a5a" name="支出" strokeWidth={2} dot={range===7} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useDb } from '../api/db-context';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#4F46E5','#ef4444','#22c55e','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#64748b','#f97316','#3b82f6','#10b981','#6366f1','#84cc16'];

export default function StatsPage() {
  const api = useDb();
  const [records, setRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pieTab, setPieTab] = useState('expense');
  const [timeUnit, setTimeUnit] = useState('day');
  const [drillCategory, setDrillCategory] = useState(null);
  const [heatmapDate, setHeatmapDate] = useState(new Date());

  useEffect(() => {
    async function load() {
      try {
        const [rd, cd] = await Promise.all([api.records.list({pageSize:9999}), api.categories.list()]);
        setRecords(rd.data); setCategories(cd);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [api]);

  const catMap = useMemo(() => { const m={}; categories.forEach(c=>{m[c.id]=c;}); return m; }, [categories]);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const thisDay = now.toISOString().slice(0,10);

  // Summaries
  const monthRecs = records.filter(r => r.date.startsWith(thisMonth));
  const monthIncome = monthRecs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
  const monthExpense = monthRecs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
  const todayRecs = records.filter(r=>r.date===thisDay);
  const todayIncome = todayRecs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
  const todayExpense = todayRecs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);
  const weekRecs = records.filter(r => {
    const d = new Date(r.date); const diff = (now-d)/(1000*86400); return diff >= 0 && diff < 7;
  });
  const weekIncome = weekRecs.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0);
  const weekExpense = weekRecs.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0);

  // ====== 1. Donut Data ======
  const donutData = useMemo(() => {
    const map = {};
    monthRecs.filter(r => r.type === pieTab).forEach(r => {
      const name = (catMap[r.categoryId]||{}).name || '其他';
      map[name] = (map[name]||0) + r.amount;
    });
    let data = Object.entries(map).map(([name,value]) => ({name, value: Math.round(value*100)/100}));
    data.sort((a,b) => b.value - a.value);
    const total = data.reduce((s,d)=>s+d.value,0);
    const main = data.filter(d => d.value/total >= 0.05);
    const other = data.filter(d => d.value/total < 0.05);
    if (other.length > 0) main.push({ name: '其他', value: Math.round(other.reduce((s,d)=>s+d.value,0)*100)/100 });
    return main;
  }, [monthRecs, pieTab, catMap]);

  // ====== 2. Line Chart Data ======
  const lineData = useMemo(() => {
    const count = timeUnit === 'day' ? 30 : timeUnit === 'week' ? 12 : 12;
    const days = [];
    for (let i = count-1; i >= 0; i--) {
      const d = new Date(now);
      if (timeUnit === 'day') d.setDate(d.getDate() - i);
      else if (timeUnit === 'week') d.setDate(d.getDate() - i * 7);
      else d.setMonth(d.getMonth() - i);
      const start = d.toISOString().slice(0,10);
      const endDate = new Date(d);
      if (timeUnit === 'week') endDate.setDate(endDate.getDate()+6);
      else if (timeUnit === 'month') endDate.setMonth(endDate.getMonth()+1);
      const end = endDate.toISOString().slice(0,10);
      const period = records.filter(r => r.date >= start && r.date < end);
      days.push({
        label: timeUnit==='day' ? start.slice(5) : timeUnit==='week' ? start.slice(5) : start.slice(0,7),
        income: period.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0),
        expense: period.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0),
        balance: period.filter(r=>r.type==='income').reduce((s,r)=>s+r.amount,0) - period.filter(r=>r.type==='expense').reduce((s,r)=>s+r.amount,0),
      });
    }
    return days;
  }, [records, timeUnit]);

  // ====== 3. Calendar Heatmap ======
  const heatmapData = useMemo(() => {
    const y = heatmapDate.getFullYear(), m = heatmapDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const inAmt = records.filter(r=>r.date===dateStr&&r.type==='income').reduce((s,r)=>s+r.amount,0);
      const outAmt = records.filter(r=>r.date===dateStr&&r.type==='expense').reduce((s,r)=>s+r.amount,0);
      const net = inAmt - outAmt;
      cells.push({ day: d, date: dateStr, income: inAmt, expense: outAmt, net });
    }
    return { cells, year: y, month: m };
  }, [records, heatmapDate]);

  // ====== 4. Sankey ======
  const sankeyData = useMemo(() => {
    const incomeMap = {}, expenseMap = {};
    records.forEach(r => {
      const cat = catMap[r.categoryId];
      if (!cat) return;
      if (r.type === 'income') incomeMap[cat.name] = (incomeMap[cat.name]||0) + r.amount;
      else expenseMap[cat.name] = (expenseMap[cat.name]||0) + r.amount;
    });
    const totalIn = Object.values(incomeMap).reduce((s,v)=>s+v,0) || 1;
    const totalOut = Object.values(expenseMap).reduce((s,v)=>s+v,0) || 1;
    return {
      income: Object.entries(incomeMap).sort((a,b)=>b[1]-a[1]).slice(0,5),
      expense: Object.entries(expenseMap).sort((a,b)=>b[1]-a[1]).slice(0,5),
      totalIn, totalOut
    };
  }, [records, catMap]);

  const WEEKDAYS = ['日','一','二','三','四','五','六'];
  const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  if (loading) return <div className="page"><div className="loading"><span>加载中...</span></div></div>;

  return (
    <div className="page">
      {/* Summary Cards — redesigned */}
      <div className="summary-row">
        <div className="summary-card">
          <div className="summary-card-top"><span className="summary-dot income"/>本月收入</div>
          <div className="summary-card-val income">¥{monthIncome.toFixed(2)}</div>
          <div className="summary-card-sub">日均 ¥{(monthIncome/new Date(now.getFullYear(),now.getMonth()+1,0).getDate()).toFixed(0)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top"><span className="summary-dot expense"/>本月支出</div>
          <div className="summary-card-val expense">¥{monthExpense.toFixed(2)}</div>
          <div className="summary-card-sub">日均 ¥{(monthExpense/new Date(now.getFullYear(),now.getMonth()+1,0).getDate()).toFixed(0)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top"><span className={`summary-dot ${monthIncome>=monthExpense?'income':'expense'}`}/>本月结余</div>
          <div className={`summary-card-val ${monthIncome>=monthExpense?'income':'expense'}`}>¥{(monthIncome-monthExpense).toFixed(2)}</div>
          <div className="summary-card-sub">{monthIncome>0?((monthIncome-monthExpense)/monthIncome*100).toFixed(0):0}% 剩余</div>
        </div>
      </div>
      <div className="summary-row sub">
        <div className="summary-mini">
          <span className="summary-mini-label">今日</span>
          <span className="summary-mini-val income">+{todayIncome.toFixed(0)}</span>
          <span className="summary-mini-val expense">-{todayExpense.toFixed(0)}</span>
        </div>
        <div className="summary-mini">
          <span className="summary-mini-label">本周</span>
          <span className="summary-mini-val income">+{weekIncome.toFixed(0)}</span>
          <span className="summary-mini-val expense">-{weekExpense.toFixed(0)}</span>
        </div>
      </div>

      {/* 1. Heatmap */}
      <div className="chart-box" style={{marginBottom:16}}>
        <div className="chart-header">
          <h3>日历热力图</h3>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button className="btn btn-sm" onClick={()=>setHeatmapDate(new Date(heatmapDate.getFullYear(),heatmapDate.getMonth()-1))}>‹</button>
            <span style={{fontWeight:700}}>{heatmapDate.getFullYear()}年{heatmapDate.getMonth()+1}月</span>
            <button className="btn btn-sm" onClick={()=>setHeatmapDate(new Date(heatmapDate.getFullYear(),heatmapDate.getMonth()+1))}>›</button>
          </div>
        </div>
        <div className="heatmap-grid">
          {WEEKDAYS.map(w=><div key={w} className="heatmap-header-cell">{w}</div>)}
          {heatmapData.cells.map((cell,i) => (
            <div key={i} className={`heatmap-cell ${cell ? (cell.net >= 0 ? 'heatmap-green' : 'heatmap-red') : 'heatmap-empty'}`} title={cell?`${cell.date} 收+${cell.income.toFixed(0)} 支-${cell.expense.toFixed(0)} 净${cell.net>=0?'+':''}${cell.net.toFixed(0)}`:''}>
              {cell && <span className="heatmap-day">{cell.day}</span>}
              {cell && <span className="heatmap-net">{cell.net !== 0 ? (cell.net>=0?'+':'')+Math.round(cell.net) : ''}</span>}
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span className="heatmap-legend-item"><span className="heatmap-dot green"/> 结余（绿）</span>
          <span className="heatmap-legend-item"><span className="heatmap-dot red"/> 超支（红）</span>
        </div>
      </div>

      {/* 2. Donut */}
      <div className="chart-box" style={{marginBottom:16}}>
        <div className="chart-header">
          <h3>分类占比（{MONTHS[now.getMonth()]}）</h3>
          <div className="chart-tabs">
            {['expense','income'].map(t => (
              <button key={t} className={`chart-tab ${pieTab===t?'active':''}`} onClick={()=>setPieTab(t)}>{t==='expense'?'支出':'收入'}</button>
            ))}
          </div>
        </div>
        {donutData.length===0 ? <div className="empty-hint" style={{padding:40}}>暂无数据</div> : (
          <div style={{display:'flex',alignItems:'center',flexWrap:'wrap'}}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart><Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>{donutData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} stroke="none"/>)}</Pie><Tooltip formatter={v=>`¥${v}`}/></PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',flexWrap:'wrap',gap:'4px 12px',padding:12,justifyContent:'center',width:'100%'}}>
              {donutData.map((d,i)=><span key={i} style={{fontSize:12,display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontWeight:drillCategory&&categories.find(c=>c.name===d.name)?.id===drillCategory?700:400}} onClick={()=>{const cat=categories.find(c=>c.name===d.name&&c.type===pieTab);if(cat)setDrillCategory(drillCategory===cat.id?null:cat.id);}}><span style={{width:10,height:10,borderRadius:2,background:COLORS[i%COLORS.length],display:'inline-block'}}/> {d.name} ¥{d.value}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* 3. Line Chart */}
      <div className="chart-box" style={{marginBottom:16}}>
        <div className="chart-header">
          <h3>收支趋势</h3>
          <div className="chart-tabs">
            {[{k:'day',l:'日'},{k:'week',l:'周'},{k:'month',l:'月'}].map(t => (
              <button key={t.k} className={`chart-tab ${timeUnit===t.k?'active':''}`} onClick={()=>setTimeUnit(t.k)}>{t.l}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="label" fontSize={11}/>
            <YAxis fontSize={11}/>
            <Tooltip formatter={v=>`¥${v}`}/>
            <Legend/>
            <Line type="monotone" dataKey="income" name="收入" stroke="#22c55e" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="expense" name="支出" stroke="#ef4444" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="balance" name="结余" stroke="#4F46E5" strokeWidth={2} dot={false} strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Sankey */}
      <div className="chart-box">
        <h3>资金流向（全部）</h3>
        <div className="sankey-wrap">
          <div className="sankey-col">
            <div className="sankey-col-title">收入来源</div>
            {sankeyData.income.map(([name,amount]) => (
              <div key={name} className="sankey-bar-wrap">
                <span className="sankey-label">{name}</span>
                <div className="sankey-bar" style={{width:`${(amount/sankeyData.totalIn)*100}%`,background:COLORS[sankeyData.income.findIndex(i=>i[0]===name)%COLORS.length]}}/>
                <span className="sankey-amount">¥{amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="sankey-arrow">→</div>
          <div className="sankey-col">
            <div className="sankey-col-title">支出去向</div>
            {sankeyData.expense.map(([name,amount]) => (
              <div key={name} className="sankey-bar-wrap">
                <span className="sankey-label">{name}</span>
                <div className="sankey-bar" style={{width:`${(amount/sankeyData.totalOut)*100}%`,background:COLORS[(sankeyData.expense.findIndex(i=>i[0]===name)+7)%COLORS.length]}}/>
                <span className="sankey-amount">¥{amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

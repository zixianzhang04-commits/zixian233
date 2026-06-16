import React, { useState, useEffect, useRef } from 'react';
import { useDb } from '../api/db-context';
import PixelIcon from '../components/PixelIcon';

// Voice parser: extract amount, type, category, note from Chinese speech
function parseVoiceText(text, categories) {
  const result = { amount: '', type: 'expense', categoryId: '', note: '' };

  // Extract amount: "35元", "50块", "一百二", "三十五块"
  const numMap = { '零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'百':100,'千':1000,'万':10000 };
  // Try Arabic digits first
  let amt = null;
  const m1 = text.match(/(\d+(?:\.\d+)?)\s*[元块]/);
  if (m1) { amt = parseFloat(m1[1]); }
  // Try Chinese numerals: "三十五元", "一百二十块"
  if (!amt) {
    const m2 = text.match(/[零一二两三四五六七八九十百千万]+[元块]/);
    if (m2) {
      const cn = m2[0].replace(/[元块]/,'');
      let v = 0, unit = 1, tmp = 0;
      for (let i = cn.length-1; i >= 0; i--) {
        const ch = cn[i];
        if (ch === '十') { tmp = tmp || 1; v += tmp * 10 * unit; tmp = 0; }
        else if (ch === '百') { tmp = tmp || 1; v += tmp * 100 * unit; tmp = 0; }
        else if (ch === '千') { tmp = tmp || 1; v += tmp * 1000 * unit; tmp = 0; }
        else if (ch === '万') { v = (v + (tmp||0)) * 10000; unit = 1; tmp = 0; }
        else if (numMap[ch] !== undefined) { tmp = numMap[ch]; }
      }
      v += (tmp || 0) * unit;
      amt = v;
    }
  }
  if (amt && !isNaN(amt)) result.amount = String(amt);

  // Detect type
  if (/收入|工资|奖金|赚|进账|到账|退款|红包|兼职/.test(text)) result.type = 'income';
  else if (/支出|花|买|付|消费|购物|吃饭|打车|外卖/.test(text)) result.type = 'expense';

  // Match category
  for (const cat of categories) {
    if (!cat.parentId && text.includes(cat.name)) {
      result.categoryId = cat.id;
      break;
    }
  }
  // Try keyword match
  if (!result.categoryId) {
    const kwMap = { '餐饮':'餐饮','吃饭':'餐饮','外卖':'餐饮','午饭':'餐饮','晚饭':'餐饮','早餐':'餐饮',
      '交通':'交通','打车':'交通','地铁':'交通','公交':'交通','加油':'交通',
      '购物':'购物','买':'购物','超市':'购物',
      '住房':'住房','房租':'住房','房贷':'住房',
      '娱乐':'娱乐','电影':'娱乐','游戏':'娱乐',
      '医疗':'医疗','药':'医疗','医院':'医疗',
      '工资':'工资','奖金':'奖金','兼职':'兼职','投资':'投资收益' };
    for (const [kw, catName] of Object.entries(kwMap)) {
      if (text.includes(kw)) {
        const cat = categories.find(c => c.name === catName && !c.parentId);
        if (cat) { result.categoryId = cat.id; break; }
      }
    }
  }

  // Use whole text as note, minus extracted parts
  result.note = text.replace(/[元块]|\d+/g, '').trim().slice(0, 50);
  return result;
}

export default function AddRecordPage() {
  const api = useDb();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    amount: '', type: 'expense', categoryId: '', subcategoryId: '',
    date: new Date().toISOString().slice(0, 10), note: '', images: '[]',
  });
  const [errors, setErrors] = useState({});
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef(null);

  // Voice recognition
  const voiceSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const a=()=>setOnline(true),b=()=>setOnline(false); window.addEventListener('online',a); window.addEventListener('offline',b); return ()=>{window.removeEventListener('online',a);window.removeEventListener('offline',b);}; }, []);

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('您的浏览器不支持语音识别，请使用 Chrome 或 Edge'); return; }
    if (!navigator.onLine) { alert('语音识别需要网络连接，请检查网络后重试'); return; }
    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN';
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setVoiceText(transcript);
      if (e.results[0].isFinal) {
        const parsed = parseVoiceText(transcript, categories);
        setForm(prev => {
          const next = { ...prev };
          if (parsed.amount) next.amount = parsed.amount;
          if (parsed.type && parsed.type !== prev.type) next.type = parsed.type;
          if (parsed.categoryId) next.categoryId = parsed.categoryId;
          if (parsed.note) next.note = parsed.note;
          return next;
        });
        setListening(false);
      }
    };
    rec.onerror = (e) => { setListening(false); if (e.error !== 'aborted') console.error(e); };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true); setVoiceText('');
  }

  function stopVoice() {
    if (recognitionRef.current) { recognitionRef.current.abort(); }
    setListening(false);
  }

  useEffect(() => {
    try { setCategories(api.categories.list()); } catch(e) { console.error(e); }
  }, [api]);

  const parentCategories = categories.filter(c => !c.parentId && c.type === form.type);

  function updateField(field, value) {
    const updates = { ...form, [field]: value };
    if (field === 'type') { updates.categoryId = ''; }
    setForm(updates);
  }

  function validate() {
    const err = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) err.amount = '请输入有效金额';
    if (!form.categoryId) err.categoryId = '请选择分类';
    if (!form.date) err.date = '请选择日期';
    setErrors(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    try {
      api.records.create({ ...form, amount: Number(form.amount), subcategoryId: form.subcategoryId || null });
      if (typeof window.__setActiveNav === 'function') window.__setActiveNav('records');
    } catch (err) { console.error(err); }
  }

  function handleAddImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('图片不能超过 2MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400, scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
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
  }

  return (
    <div className="page">
      <div className="add-record-page">
        <div className="voice-header">
          <h2>添一笔</h2>
          <button type="button" className={`btn btn-sm ${listening?'btn-voice-active':''}`}
            onClick={listening ? stopVoice : startVoice}
            disabled={!online || !voiceSupported}
            title={!voiceSupported ? '浏览器不支持' : !online ? '需要网络连接' : '语音记账（说：午餐花了35元）'}>
            🎤 {listening ? '聆听中...' : !online ? '需要网络' : '语音记'}
          </button>
        </div>
        {voiceText && <div className="voice-text">"{voiceText}"</div>}
        <form onSubmit={handleSubmit}>
          {/* 类型 */}
          <div className="form-group">
            <label className="form-label">类型</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn ${form.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => updateField('type', 'expense')}>支出</button>
              <button type="button" className={`toggle-btn ${form.type === 'income' ? 'active income' : ''}`}
                onClick={() => updateField('type', 'income')}>收入</button>
            </div>
          </div>

          {/* 金额 */}
          <div className="form-group">
            <label className="form-label">金额</label>
            <input type="number" className={`form-input ${errors.amount ? 'is-error' : ''}`} placeholder="0.00"
              step="0.01" min="0" value={form.amount} onChange={e => updateField('amount', e.target.value)} autoFocus />
            {errors.amount && <span className="form-error">{errors.amount}</span>}
          </div>

          {/* 分类卡片 */}
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
            <input type="date" className={`form-input ${errors.date ? 'is-error' : ''}`}
              value={form.date} onChange={e => updateField('date', e.target.value)} />
            {errors.date && <span className="form-error">{errors.date}</span>}
          </div>

          {/* 备注 */}
          <div className="form-group">
            <label className="form-label">备注</label>
            <input type="text" className="form-input" placeholder="添加备注..."
              value={form.note} onChange={e => updateField('note', e.target.value)} />
          </div>

          {/* 图片 */}
          <div className="form-group">
            <label className="form-label">图片</label>
            <div className="image-list">
              {(JSON.parse(form.images || '[]')).map((img, i) => (
                <div key={i} className="image-thumb">
                  <img src={img} alt="" />
                  <button type="button" className="image-remove" onClick={() => {
                    const list = JSON.parse(form.images || '[]'); list.splice(i, 1);
                    updateField('images', JSON.stringify(list));
                  }}>✕</button>
                </div>
              ))}
              <label className="image-upload-btn">
                ＋ <input type="file" accept="image/*" hidden onChange={handleAddImage} />
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center', padding: 14 }}>保存</button>
        </form>
      </div>
    </div>
  );
}

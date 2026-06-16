import React, { useState } from 'react';
import PixelIcon from '../components/PixelIcon';

const PROFILE_KEY = 'ledger_profile';
function loadProfile() { try { return JSON.parse(localStorage.getItem(PROFILE_KEY))||{}; } catch { return {}; } }
function saveProfile(data) { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)); }

export default function ProfilePage() {
  const [profile, setProfile] = useState(loadProfile);
  const [showForm, setShowForm] = useState(false);
  const [pf, setPf] = useState({ name: '', avatar: '', bio: '' });

  function handleOpenProfile() {
    setPf({ name: profile.name || '', avatar: profile.avatar || '', bio: profile.bio || '' });
    setShowForm(true);
  }
  function handleSaveProfile(e) {
    e.preventDefault();
    saveProfile({ ...profile, name: pf.name.trim(), avatar: pf.avatar.trim(), bio: pf.bio.trim() });
    setProfile(loadProfile()); setShowForm(false);
  }

  return (
    <div className="page">
      {/* 头像区域 */}
      <div className="profile-header">
        <div className="profile-avatar" onClick={handleOpenProfile}>
          {profile.avatar ? <img src={profile.avatar} alt="" /> : <span className="profile-avatar-placeholder">{(profile.name||'我')[0]}</span>}
        </div>
        <div className="profile-info">
          <h2>{profile.name || '未设置昵称'}</h2>
          <p>{profile.bio || '这个人很懒，什么都没写…'}</p>
        </div>
        <button className="btn btn-sm" onClick={handleOpenProfile}>编辑资料</button>
      </div>

      {/* 我的管理 */}
      <div className="profile-section">
        <button className="profile-link-btn"
          onClick={() => { if (typeof window.__setActiveNav === 'function') window.__setActiveNav('management'); }}>
          <PixelIcon name="nav-categories" size={20} />
          <span>我的管理</span>
          <span className="profile-link-arrow">›</span>
        </button>
      </div>

      {/* 版本信息 */}
      <div className="profile-section">
        <h3>关于</h3>
        <div className="profile-item"><span>简单记账</span><span className="profile-item-right">v0.2.0</span></div>
        <div className="profile-item"><span>技术</span><span className="profile-item-right">React + sql.js + PWA</span></div>
      </div>

      {/* 编辑资料弹窗 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>编辑资料</h3><button className="modal-close" onClick={() => setShowForm(false)}>✕</button></div>
            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">头像 URL</label><input type="text" className="form-input" placeholder="图片链接" value={pf.avatar} onChange={e => setPf({...pf, avatar: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">昵称</label><input type="text" className="form-input" placeholder="你的名字" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">签名</label><input type="text" className="form-input" placeholder="写一句话…" value={pf.bio} onChange={e => setPf({...pf, bio: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

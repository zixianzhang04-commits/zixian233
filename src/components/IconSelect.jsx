import React, { useState, useRef, useEffect } from 'react';
import PixelIcon from './PixelIcon';

export default function IconSelect({ value, onChange, options, placeholder = '请选择', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div className={`icon-select ${className}`} ref={ref}>
      <button type="button" className={`icon-select-trigger form-input`} onClick={() => setOpen(!open)}>
        {selected ? (
          <><PixelIcon name={selected.icon} size={16} /> <span>{selected.label}</span></>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        <span className="arrow">▾</span>
      </button>
      {open && (
        <div className="icon-select-dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`icon-select-option ${value === opt.value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <PixelIcon name={opt.icon} size={16} />
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

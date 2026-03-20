"use client";
import React, { useState, useEffect, useRef } from "react";
import { MONTHS } from "../lib/helpers";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";


interface DatePickerProps {
  value: string;        // YYYY-MM-DD
  onChange: (val: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  dropdownAlign?: 'left' | 'right'; // where dropdown aligns
}

const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const todayStr = `${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}-${String(TODAY.getDate()).padStart(2,'0')}`;

function toStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtDisplay(str: string) {
  if (!str) return '';
  const d = new Date(str + 'T00:00');
  return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function DatePicker({ value, onChange, placeholder = 'Pick a date', style, dropdownAlign = 'left' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    if (value) { const d = new Date(value + 'T00:00'); d.setDate(1); return d; }
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(1);
    return d;
  });
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Sync cursor month to value
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00'); d.setDate(1);
      setCursor(d);
    }
  }, [value]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(o => !o);
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: { date: string; day: number; isOther: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrev - i);
    cells.push({ date: toStr(d), day: d.getDate(), isOther: true });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    cells.push({ date: toStr(d), day: i, isOther: false });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ date: toStr(d), day: i, isOther: true });
  }

  const handleSelect = (dateStr: string) => {
    onChange(dateStr);
    setOpen(false);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCursor(new Date(year, month - 1, 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCursor(new Date(year, month + 1, 1));
  };
  const goToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date(); now.setHours(0,0,0,0);
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    handleSelect(todayStr);
  };

  const displayLabel = value ? fmtDisplay(value) : placeholder;

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-block', width: '100%', ...style }}
      onClick={e => e.stopPropagation()}
    >
      {/* Trigger button */}
      <div
        className={`goto-wrap${open ? ' open' : ''}`}
        style={{ width:'100%', height:'40px', borderRadius:'10px', cursor:'pointer' }}
        onClick={toggleOpen}
      >
        <CalendarDays size={14} className="goto-cal-icon" />
        <span className="goto-display" style={{ flex:1, fontSize:'13px', color: value ? 'var(--dark)' : '#9ca3af', fontWeight: value ? 700 : 500, fontFamily:"'Cairo',sans-serif", whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {displayLabel}
        </span>
        <ChevronDown size={12} className="goto-caret" />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="goto-picker open"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            ...(dropdownAlign === 'right' ? { right: 0, left: 'auto' } : { left: 0, right: 'auto' }),
            width: '264px',
            zIndex: 999,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="gp-header">
            <button className="gp-nav" onClick={prev}><ChevronLeft size={12} /></button>
            <span className="gp-month-label">{MONTHS[month]} {year}</span>
            <button className="gp-nav" onClick={next}><ChevronRight size={12} /></button>
          </div>
          <div className="gp-day-headers">
            {DAYS.map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="gp-grid">
            {cells.map((c, i) => (
              <div
                key={i}
                className={`gp-day${c.isOther ? ' other' : ''}${c.date === todayStr ? ' today' : ''}${c.date === value ? ' selected' : ''}`}
                onClick={e => { e.stopPropagation(); handleSelect(c.date); }}
              >
                {c.day}
              </div>
            ))}
          </div>
          <div className="gp-footer">
            <button className="gp-today-btn" onClick={goToday}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}

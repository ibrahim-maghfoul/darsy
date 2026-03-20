"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCalendar } from "../context/CalendarContext";
import { CalEvent, CAT_ICO, timeToMin, MONTHS } from "../lib/helpers";
import { CalendarPlus, Clock, CalendarDays, Bell, X } from "lucide-react";
import DatePicker from "./DatePicker";

import TimePicker from "./TimePicker";

type EType = 'day' | 'multi';

const COLORS = ['dark','blue','green','orange','red','purple','pink','teal','white'];
const COLOR_GRAD: Record<string,string> = {
  dark:'linear-gradient(135deg,#0f172a,#1e293b)', blue:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  green:'linear-gradient(135deg,#16a34a,#14532d)', orange:'linear-gradient(135deg,#f97316,#c2410c)',
  red:'linear-gradient(135deg,#ef4444,#b91c1c)', purple:'linear-gradient(135deg,#8b5cf6,#5b21b6)',
  pink:'linear-gradient(135deg,#ec4899,#9d174d)', teal:'linear-gradient(135deg,#14b8a6,#0f766e)',
  white:'linear-gradient(135deg,#fff,#e2e8f0)',
};
const CAT_UNIQUE = ['class','learning','deadline','personal','reminder','meeting','health','sport','travel','other'];

function calcDur(t?: string, e?: string): string {
  if (!t || !e) return '—';
  const diff = timeToMin(e) - timeToMin(t);
  if (diff <= 0) return '—';
  const h = Math.floor(diff/60), m = diff%60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

const SIDE_ITEMS = [
  { id:'day',   icon: Clock,         label:'Single Day'  },
  { id:'multi', icon: CalendarDays,  label:'Multi-Day'   },
];


export default function AddEventDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addEvent, snackbar } = useCalendar();

  const [etype,    setEtype]    = useState<EType>('day');
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [date,     setDate]     = useState('');
  const [startDate,setStartDate]= useState('');
  const [endDate,  setEndDate]  = useState('');
  const [time,     setTime]     = useState<string|undefined>();
  const [endTime,  setEndTime]  = useState<string|undefined>();
  const [category, setCategory] = useState('class');
  const [color,    setColor]    = useState('dark');
  const [allDay,   setAllDay]   = useState(false);
  const [reminder, setReminder] = useState(false);
  const [remMins,  setRemMins]  = useState(15);

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const durLabel = calcDur(time, endTime);

  const reset = () => {
    setTitle(''); setDesc(''); setDate(''); setStartDate(''); setEndDate('');
    setTime(undefined); setEndTime(undefined); setAllDay(false); setReminder(false);
    setEtype('day'); setCategory('class'); setColor('dark');
  };

  const quickAdd = () => {
    if (!title.trim()) { snackbar('Title is required','','⚠️'); return; }
    const d = etype==='day' ? date : startDate;
    if (!d) { snackbar('Date is required','','⚠️'); return; }
    if (etype==='multi' && !endDate) { snackbar('End date is required','','⚠️'); return; }
    const now = new Date().toISOString();
    const ev: CalEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      title: title.trim(), desc: desc.trim(),
      date: etype==='day' ? date : startDate,
      endDate: etype==='multi' ? endDate : undefined,
      time: !allDay && etype==='day' ? time : undefined,
      endTime: !allDay && etype==='day' ? endTime : undefined,
      duration: (!allDay && time && endTime) ? timeToMin(endTime)-timeToMin(time) : undefined,
      allDay: etype==='day' ? allDay : false,
      category, color, reminder, reminderMins: remMins,
      createdAt: now,
    };
    addEvent(ev);
    snackbar('Event added', title.trim(), '✅');
    reset();
    onClose();
  };

  if (!open) return null;

  const modal = (
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0,
        background:'rgba(0,0,0,.35)',
        backdropFilter:'blur(6px)',
        zIndex:1000,
        display:'flex', alignItems:'center', justifyContent:'center',
        animation:'fadeIn .2s ease',
      }}
    >
      {/* Modal box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'#fff',
          borderRadius:'26px',
          width:'860px',
          maxWidth:'96vw',
          maxHeight:'90vh',
          boxShadow:'0 30px 80px rgba(0,0,0,.22)',
          display:'flex',
          overflow:'hidden',
          animation:'tpPop .3s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* ── LEFT SIDE NAVIGATION ── */}
        <div style={{
          width:'200px',
          flexShrink:0,
          background:'linear-gradient(180deg,#f0fdf4 0%,#dcfce7 100%)',
          borderRight:'1.5px solid #bbf7d0',
          padding:'28px 0 24px',
          display:'flex',
          flexDirection:'column',
        }}>
          {/* Title */}
          <div style={{ padding:'0 20px 24px' }}>
            <div style={{
              width:'40px', height:'40px', borderRadius:'12px',
              background:'rgba(22,163,74,.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              marginBottom:'12px',
            }}>
              <CalendarPlus size={20} color="var(--green)" />
            </div>

            <div style={{ fontSize:'16px', fontWeight:900, color:'#14532d', lineHeight:1.2 }}>
              Add Event
            </div>
            <div style={{ fontSize:'11px', color:'#4ade80', marginTop:'4px', fontWeight:600 }}>
              Create a new event
            </div>
          </div>

          {/* Nav items */}
          <div style={{ padding:'0 12px', display:'flex', flexDirection:'column', gap:'4px' }}>
            {SIDE_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setEtype(item.id as EType)}
                style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  padding:'11px 12px', borderRadius:'12px', border:'none',
                  background: etype === item.id ? 'rgba(22,163,74,.18)' : 'transparent',
                  color: etype === item.id ? '#15803d' : '#6b7280',
                  fontFamily:"'Cairo',sans-serif", fontSize:'13px', fontWeight:700,
                  cursor:'pointer', transition:'all .2s', textAlign:'left',
                  outline: etype === item.id ? '1.5px solid rgba(34,197,94,.4)' : 'none',
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>

            ))}
          </div>

          <div style={{ flex:1 }} />

        </div>

        {/* ── RIGHT CONTENT AREA ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
          {/* Header */}
          <div style={{
            padding:'24px 28px 20px',
            borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexShrink:0,
          }}>
            <div>
              <div style={{ fontSize:'20px', fontWeight:900, color:'var(--dark)' }}>
                {etype === 'day' ? 'Single Day Event' : 'Multi-Day Event'}
              </div>
              <div style={{ fontSize:'12px', color:'#9ca3af', marginTop:'2px' }}>
                {etype === 'day' ? 'Create an event for one specific day' : 'Create an event that spans multiple days'}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background:'#f3f4f6', border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'15px', color:'#6b7280', transition:'all .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='#fee2e2'; (e.currentTarget as HTMLElement).style.color='#ef4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='#f3f4f6'; (e.currentTarget as HTMLElement).style.color='#6b7280'; }}
            >
              <X size={18} />
            </button>

          </div>

          {/* Form body — scrollable */}
          <div style={{ flex:1, overflowY:'auto', padding:'24px 28px', scrollbarWidth:'thin', scrollbarColor:'var(--green-mid) transparent' }}>

            {/* Row 1: Title + Category side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
              <div className="field" style={{ margin:0 }}>
                <label>Title *</label>
                <input type="text" value={title} placeholder="e.g. UX Research Class…" onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="field" style={{ margin:0 }}>
                <label>Category</label>
                <div className="cat-select-wrap">
                  <span className="cat-icon-prefix">{CAT_ICO[category] || '📌'}</span>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {CAT_UNIQUE.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}{c==='other'?'…':''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Description */}
            <div className="field" style={{ marginBottom:'16px' }}>
              <label>Description</label>
              <textarea
                rows={2} value={desc} placeholder="Optional notes…"
                onChange={e => setDesc(e.target.value)}
                style={{ resize:'none', width:'100%', boxSizing:'border-box', background:'rgba(255,255,255,.8)', border:'1.5px solid var(--border)', borderRadius:'10px', padding:'9px 12px', fontFamily:"'Cairo',sans-serif", fontSize:'13px', color:'var(--dark)', outline:'none' }}
              />
            </div>

            {/* ── SINGLE DAY specific fields ── */}
            {etype === 'day' && (
              <>
                {/* Row 3: Date + All-day toggle */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                  <div className="field" style={{ margin:0 }}>
                    <label>Date *</label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                  <div className="field" style={{ margin:0 }}>
                    <label style={{ marginBottom:'8px', display:'block' }}>Options</label>
                    <div className="toggle-row" style={{ marginBottom:0 }}>
                      <label className="toggle-label" htmlFor="ad-allday">
                        <CalendarDays size={14} color="var(--green)" /> All-day event
                      </label>

                      <label className="toggle-switch">
                        <input type="checkbox" id="ad-allday" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
                        <span className="toggle-track"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 4: Start Time + End Time (hidden when all-day) */}
                {!allDay && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                    <div className="field" style={{ margin:0 }}>
                      <label>Start Time</label>
                      <TimePicker value={time} onChange={setTime} label="Start Time" />
                    </div>
                    <div className="field" style={{ margin:0 }}>
                      <label>End Time</label>
                      <TimePicker value={endTime} onChange={setEndTime} label="End Time" />
                    </div>
                    <div className="field" style={{ margin:0 }}>
                      <label>
                        Duration <span style={{ fontSize:'9px', fontWeight:600, color:'var(--green)' }}>AUTO</span>
                      </label>
                      <div className={`dur-card${durLabel !== '—' ? ' has-value' : ''}`}>
                        {durLabel}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── MULTI-DAY specific fields ── */}
            {etype === 'multi' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>
                <div className="field" style={{ margin:0 }}>
                  <label>Start Date *</label>
                  <DatePicker value={startDate} onChange={setStartDate} placeholder="Pick start date" />
                </div>
                <div className="field" style={{ margin:0 }}>
                  <label>End Date *</label>
                  <DatePicker value={endDate} onChange={setEndDate} placeholder="Pick end date" dropdownAlign="right" />
                </div>
              </div>
            )}

            {/* Row: Color + Reminder side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>
              <div className="field" style={{ margin:0 }}>
                <label className="color-picker-label">Card Color</label>
                <div className="q-color-row" style={{ flexWrap:'wrap', gap:'8px' }}>
                  {COLORS.map(c => (
                    <div
                      key={c}
                      className={`color-swatch${color===c?' selected':''}`}
                      style={{ background:COLOR_GRAD[c], ...(c==='white'?{border:'2px solid #e2e8f0'}:{}) }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="field" style={{ margin:0 }}>
                <label style={{ display:'block', marginBottom:'8px' }}>Reminder</label>
                <div className="toggle-row reminder-bg" style={{ marginBottom:0 }}>
                  <label className="toggle-label" htmlFor="ad-rem">
                    <Bell size={14} color="var(--green)" /> Remind me
                  </label>

                  <div className={`reminder-mins-wrap${reminder?' visible':''}`}>
                    <input type="number" value={remMins} min={1} max={1440} onChange={e => setRemMins(parseInt(e.target.value)||15)} />
                    <span>min</span>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" id="ad-rem" checked={reminder} onChange={e => setReminder(e.target.checked)} />
                    <span className="toggle-track"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding:'16px 28px',
            borderTop:'1px solid var(--border)',
            display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'12px',
            flexShrink:0,
          }}>
            <button
              onClick={onClose}
              style={{
                padding:'10px 20px', borderRadius:'10px', border:'1.5px solid #e5e7eb',
                background:'#fff', color:'#6b7280',
                fontFamily:"'Cairo',sans-serif", fontSize:'13px', fontWeight:800, cursor:'pointer',
              }}
            >
              Cancel
            </button>
            <button className="btn-primary" style={{ width:'auto', padding:'10px 28px' }} onClick={quickAdd}>
              <CalendarPlus size={16} style={{ marginRight:'6px' }} />
              Add to Calendar
            </button>

          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

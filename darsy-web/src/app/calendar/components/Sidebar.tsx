"use client";
import React, { useState } from "react";
import { useCalendar } from "../context/CalendarContext";
import { CalendarPlus, ChevronDown, Clock, CalendarDays, Sun, Bell } from "lucide-react";

import { CalEvent, CAT_ICO, timeToMin } from "../lib/helpers";
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
const CATS = ['class','learning','deadline','personal','reminder','meeting','health','sport','travel','other'];

export default function Sidebar({ open }: { open: boolean }) {
  const { addEvent, snackbar } = useCalendar();

  const [etype,   setEtype]   = useState<EType>('day');
  const [title,   setTitle]   = useState('');
  const [desc,    setDesc]    = useState('');
  const [date,    setDate]    = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [time,    setTime]    = useState<string|undefined>();
  const [endTime, setEndTime] = useState<string|undefined>();
  const [category, setCategory] = useState('class');
  const [color,   setColor]   = useState('dark');
  const [allDay,  setAllDay]  = useState(false);
  const [reminder, setReminder] = useState(false);
  const [remMins,  setRemMins]  = useState(15);
  const [isExpanded, setIsExpanded] = useState(true);

  const durLabel = (() => {
    if (!time || !endTime) return '—';
    const diff = timeToMin(endTime) - timeToMin(time);
    if (diff <= 0) return '—';
    const h = Math.floor(diff/60), m = diff%60;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
  })();

  const quickAdd = () => {
    if (!title.trim()) { snackbar('Title is required', '', '⚠️'); return; }
    const d = etype === 'day' ? date : startDate;
    if (!d) { snackbar('Date is required', '', '⚠️'); return; }
    if (etype === 'multi' && !endDate) { snackbar('End date is required', '', '⚠️'); return; }
    const now = new Date().toISOString();
    const ev: CalEvent = {
      id:          `ev-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      title:       title.trim(), desc: desc.trim(),
      date:        etype==='day' ? date : startDate,
      endDate:     etype==='multi' ? endDate : undefined,
      time:        !allDay && etype==='day' ? time : undefined,
      endTime:     !allDay && etype==='day' ? endTime : undefined,
      duration:    (!allDay && time && endTime) ? timeToMin(endTime) - timeToMin(time) : undefined,
      allDay:      etype==='day' ? allDay : false,
      category, color, reminder, reminderMins: remMins,
      createdAt: now,
    };
    addEvent(ev);
    snackbar('Event added', title.trim(), '✅');
    // Reset
    setTitle(''); setDesc(''); setDate(''); setStartDate(''); setEndDate('');
    setTime(undefined); setEndTime(undefined); setAllDay(false); setReminder(false);
  };

  return (
    <div className={`left-sidebar${open ? ' sidebar-open' : ''}`} id="left-sidebar">
      <div className="left-sidebar-inner" style={{ paddingLeft:0 }}>
        <div className="sidebar-section">
          {/* Header */}
          <div className={`sidebar-section-header${isExpanded?' expanded':''}`} id="add-event-hdr">
            <div className="sidebar-section-title">
              <div className="sidebar-section-icon">
                <CalendarPlus size={16} color="var(--green)" />
              </div>

              Add Event
            </div>
            <ChevronDown size={14} className={`sidebar-chevron${isExpanded?'':' rotated'}`}
              style={{ cursor:'pointer', padding:'4px', transition:'transform .25s' }}
              onClick={() => setIsExpanded(e => !e)}
            />
          </div>

          {/* Body */}
          <div className={`sidebar-section-body${isExpanded?' expanded':''}`} id="add-event-body">
            <div className="sidebar-section-body-inner">
              {/* Event type */}
              <div className="event-type-toggle" style={{ marginBottom:'10px' }}>
                <button className="add-opt-btn" onClick={() => { setEtype('day'); setIsExpanded(false); }}>
                  <Clock size={16} /> Single Day
                </button>
                <button className="add-opt-btn" onClick={() => { setEtype('multi'); setIsExpanded(false); }}>
                  <CalendarDays size={16} /> Multi-Day
                </button>
              </div>

              <div className="field"><label>Title *</label>
                <input type="text" value={title} placeholder="e.g. UX Research Class…" onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="field"><label>Description</label>
                <textarea rows={2} value={desc} placeholder="Optional notes…"
                  style={{ resize:'none', width:'100%', boxSizing:'border-box', background:'#f8fafc', border:'1.5px solid var(--border)', borderRadius:'10px', padding:'8px 10px', fontFamily:"'Cairo',sans-serif", fontSize:'12px', color:'var(--dark)', outline:'none', transition:'border-color .2s' }}
                  onChange={e => setDesc(e.target.value)} />
              </div>

              {/* Single-day fields */}
              <div className={`anim-section${etype!=='day'?' collapsed':''}`}>
                <div className="anim-inner">
                  <div className="field" style={{ marginBottom:'8px', position:'relative' }}>
                    <label>Date *</label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>
                  <div className="toggle-row" style={{ marginBottom:'8px' }}>
                    <label className="toggle-label" htmlFor="q-allday">
                      <Sun size={14} color="var(--green)" /> All-day event
                    </label>
                    <label className="toggle-switch">
                      <input type="checkbox" id="q-allday" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
                      <span className="toggle-track"></span>
                    </label>
                  </div>
                  <div className={`anim-section${allDay?' collapsed':''}`}>
                    <div className="anim-inner">
                      <div className="field-row">
                        <div className="field"><label>Start Time</label>
                          <TimePicker value={time} onChange={setTime} label="Start Time" />
                        </div>
                        <div className="field"><label>End Time</label>
                          <TimePicker value={endTime} onChange={setEndTime} label="End Time" />
                        </div>
                      </div>
                      {/* Duration card */}
                      <div className="field" style={{ marginBottom:'8px' }}>
                        <label>Duration <span style={{ fontSize:'9px', fontWeight:600, color:'var(--green)' }}>AUTO</span></label>
                        <div className={`dur-card${durLabel!=='—'?' has-value':''}`}>{durLabel}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-day fields */}
              <div className={`anim-section${etype!=='multi'?' collapsed':''}`}>
                <div className="anim-inner">
                  <div className="field-row" style={{ marginBottom:'8px' }}>
                    <div className="field"><label>Start Date *</label>
                      <DatePicker value={startDate} onChange={setStartDate} placeholder="Pick date" />
                    </div>
                    <div className="field"><label>End Date *</label>
                      <DatePicker value={endDate} onChange={setEndDate} placeholder="Pick date" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="field"><label>Category</label>
                <div className="cat-select-wrap">
                  <span className="cat-icon-prefix">{CAT_ICO[category]||'📌'}</span>
                  <select value={category} onChange={e => setCategory(e.target.value)}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}{c==='other'?'…':''}</option>)}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div className="field">
                <label className="color-picker-label">Card Color</label>
                <div className="q-color-row">
                  {COLORS.map(c => (
                    <div key={c} className={`color-swatch${color===c?' selected':''}`}
                      style={{ background:COLOR_GRAD[c], ...(c==='white'?{border:'2px solid #e2e8f0'}:{}) }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Reminder */}
              <div className="toggle-row reminder-bg" style={{ marginBottom:'10px' }}>
                <label className="toggle-label" htmlFor="q-rem">
                  <Bell size={14} color="var(--green)" /> Remind me
                </label>
                <div className="reminder-mins-wrap">
                  <input type="number" value={remMins} min={1} max={1440} onChange={e => setRemMins(parseInt(e.target.value)||15)} />
                  <span>min before</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" id="q-rem" checked={reminder} onChange={e => setReminder(e.target.checked)} />
                  <span className="toggle-track"></span>
                </label>
              </div>

              <button className="btn-primary" style={{ whiteSpace:'nowrap' }} onClick={quickAdd}>
                <CalendarPlus size={16} style={{ marginRight:'6px' }} />Add to Calendar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

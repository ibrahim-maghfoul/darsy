"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useCalendar } from "../context/CalendarContext";
import { CalEvent, CAT_ICO, addMinutes, timeToMin } from "../lib/helpers";
import { X, Clock, CalendarDays, Sun, Bell, Save, Trash2 } from "lucide-react";
import DatePicker from "./DatePicker";

import TimePicker from "./TimePicker";

type EventType = 'day' | 'multi';
const COLORS = ['dark','blue','green','orange','red','purple','pink','teal','white'];
const COLOR_GRAD: Record<string,string> = {
  dark:'linear-gradient(135deg,#0f172a,#1e293b)',
  blue:'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  green:'linear-gradient(135deg,#16a34a,#14532d)',
  orange:'linear-gradient(135deg,#f97316,#c2410c)',
  red:'linear-gradient(135deg,#ef4444,#b91c1c)',
  purple:'linear-gradient(135deg,#8b5cf6,#5b21b6)',
  pink:'linear-gradient(135deg,#ec4899,#9d174d)',
  teal:'linear-gradient(135deg,#14b8a6,#0f766e)',
  white:'linear-gradient(135deg,#fff,#e2e8f0)',
};
const CATS = ['class','learning','deadline','personal','reminder','meeting','health','sport','travel','other'];

const blank = (): Partial<CalEvent> => ({
  title:'', desc:'', date:'', endDate:'', time:'', endTime:'',
  category:'class', color:'dark', allDay:false, reminder:false, reminderMins:15,
});

export default function EventModal() {
  const { modal, closeModal, events, addEvent, updateEvent, deleteEvent, openConfirm, snackbar } = useCalendar();
  const { open, editId, defaultDate } = modal;

  const [etype,   setEtype]   = useState<EventType>('day');
  const [form,    setForm]    = useState<Partial<CalEvent>>(blank());
  const [allDay,  setAllDay]  = useState(false);
  const [custom,  setCustom]  = useState('');
  const [showCus, setShowCus] = useState(false);

  // Duration display
  const durLabel = (() => {
    if (!form.time || !form.endTime) return '—';
    const diff = timeToMin(form.endTime) - timeToMin(form.time);
    if (diff <= 0) return '—';
    const h = Math.floor(diff/60), m = diff%60;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
  })();

  // Load on open
  useEffect(() => {
    if (!open) return;
    if (editId) {
      const ev = events.find(e => e.id === editId);
      if (ev) {
        setForm({ ...ev });
        setEtype(ev.endDate && ev.endDate > ev.date ? 'multi' : 'day');
        setAllDay(!!ev.allDay);
        setShowCus(false);
        return;
      }
    }
    setForm({ ...blank(), date: defaultDate || '' });
    setEtype('day');
    setAllDay(false);
    setShowCus(false);
  }, [open, editId, defaultDate]);

  if (!open) return null;

  const set = (k: keyof CalEvent, v: any) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    if (!form.title?.trim()) { alert('Title is required'); return; }
    if (etype === 'day' && !form.date) { alert('Date is required'); return; }
    if (etype === 'multi' && (!form.date || !form.endDate)) { alert('Start and end dates required'); return; }
    const now = new Date().toISOString();
    const ev: CalEvent = {
      id:          editId || `ev-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      title:       form.title!.trim(),
      desc:        form.desc?.trim() || '',
      date:        etype === 'multi' ? form.date! : form.date!,
      endDate:     etype === 'multi' ? form.endDate! : undefined,
      time:        (!allDay && etype==='day' && form.time) ? form.time : undefined,
      endTime:     (!allDay && etype==='day' && form.endTime) ? form.endTime : undefined,
      duration:    (!allDay && etype==='day' && form.time && form.endTime)
                     ? timeToMin(form.endTime) - timeToMin(form.time) : undefined,
      allDay:      etype==='day' ? allDay : false,
      category:    form.category || 'personal',
      color:       form.color    || 'dark',
      reminder:    form.reminder || false,
      reminderMins:form.reminderMins || 15,
      createdAt:   editId ? (form.createdAt || now) : now,
      updatedAt:   now,
    };
    if (editId) { updateEvent(ev); snackbar('Event updated', ev.title, '✏️'); }
    else        { addEvent(ev);    snackbar('Event added',   ev.title, '✅'); }
    closeModal();
  };

  const onDelete = () => {
    openConfirm(`Delete "${form.title}"? This cannot be undone.`, () => {
      deleteEvent(editId!);
      snackbar('Event deleted', form.title, '🗑️');
      closeModal();
    });
  };

  return (
    <div id="overlay" className="open" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
      <div id="modal">
        {/* Header */}
        <div className="modal-head">
          <div className="modal-title">{editId ? 'Edit Event' : 'Add Event'}</div>
          <button className="close-btn" onClick={closeModal}><X size={16} /></button>
        </div>


        {/* Event type toggle */}
        <div className="event-type-toggle">
          <button className={`etype-btn${etype==='day'   ? ' active':''}`} onClick={() => setEtype('day')}>
            <Clock size={16} /> Single Day
          </button>
          <button className={`etype-btn${etype==='multi' ? ' active':''}`} onClick={() => setEtype('multi')}>
            <CalendarDays size={16} /> Multi-Day
          </button>
        </div>


        <div className="field"><label>Title *</label>
          <input type="text" value={form.title||''} placeholder="Event title…" onChange={e => set('title',e.target.value)} />
        </div>
        <div className="field"><label>Description</label>
          <textarea rows={2} value={form.desc||''} placeholder="Optional notes…" style={{ resize:'none' }}
            onChange={e => set('desc',e.target.value)} />
        </div>

        {/* Single-day fields */}
        <div className={`anim-section${etype!=='day'?' collapsed':''}`}>
          <div className="anim-inner">
            <div className="field-row">
              <div className="field"><label>Date *</label>
                <DatePicker value={form.date || ''} onChange={v => set('date',v)} />
              </div>
              <div className="field"><label>Category</label>
                <div className="cat-select-wrap">
                  <span className="cat-icon-prefix">{CAT_ICO[form.category||'class']||'📌'}</span>
                  <select value={form.category||'class'} onChange={e => { set('category',e.target.value); setShowCus(e.target.value==='other'); }}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}{c==='other'?'…':''}</option>)}
                  </select>
                </div>
                {showCus && (
                  <div className="cat-custom-row">
                    <input className="cat-custom-input" value={custom} placeholder="Custom name…" onChange={e => setCustom(e.target.value)} />
                    <button className="cat-add-btn" onClick={() => { if (custom.trim()){ set('category',custom.trim()); setShowCus(false); } }}>✓</button>
                  </div>
                )}
              </div>
            </div>

            {/* All-day toggle */}
            <div className="toggle-row" style={{ marginBottom:'8px' }}>
              <label className="toggle-label" htmlFor="m-allday">
                <Sun size={14} color="var(--green)" /> All-day event
              </label>

              <label className="toggle-switch">
                <input type="checkbox" id="m-allday" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
                <span className="toggle-track"></span>
              </label>
            </div>

            {/* Time fields */}
            <div className={`anim-section${allDay?' collapsed':''}`}>
              <div className="anim-inner">
                <div className="field-row">
                  <div className="field"><label>Start Time</label>
                    <TimePicker value={form.time} onChange={v => set('time',v)} label="Start Time" />
                  </div>
                  <div className="field"><label>End Time</label>
                    <TimePicker value={form.endTime} onChange={v => set('endTime',v)} label="End Time" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-day fields */}
        <div className={`anim-section${etype!=='multi'?' collapsed':''}`}>
          <div className="anim-inner">
            <div className="field-row">
              <div className="field"><label>Start Date *</label>
                <DatePicker value={form.date || ''} onChange={v => set('date',v)} placeholder="Pick start date" />
              </div>
              <div className="field"><label>End Date *</label>
                <DatePicker value={form.endDate || ''} onChange={v => set('endDate',v)} placeholder="Pick end date" />
              </div>
            </div>
            <div className="field"><label>Category</label>
              <div className="cat-select-wrap">
                <span className="cat-icon-prefix">{CAT_ICO[form.category||'class']||'📌'}</span>
                <select value={form.category||'class'} onChange={e => set('category',e.target.value)}>
                  {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Color picker */}
        <div className="field">
          <label className="color-picker-label">Card Color</label>
          <div className="color-picker-row">
            {COLORS.map(c => (
              <div key={c} className={`color-swatch${form.color===c?' selected':''}`}
                data-c={c}
                style={{ background: COLOR_GRAD[c], ...(c==='white'?{border:'2px solid #e2e8f0'}:{}) }}
                onClick={() => set('color',c)}
              />
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div className="toggle-row reminder-bg" style={{ marginBottom:0 }}>
          <label className="toggle-label" htmlFor="m-rem">
            <Bell size={14} color="var(--green)" /> Remind me
          </label>

          <div className="reminder-mins-wrap" id="m-rem-mins-wrap">
            <input type="number" value={form.reminderMins||15} min={1} max={1440}
              onChange={e => set('reminderMins',parseInt(e.target.value)||15)} />
            <span>min before</span>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" id="m-rem" checked={!!form.reminder} onChange={e => set('reminder',e.target.checked)} />
            <span className="toggle-track"></span>
          </label>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-primary" style={{ flex:1 }} onClick={save}>
            <Save size={16} style={{ marginRight:'6px' }} />Save Event
          </button>
          {editId && (
            <button className="btn-danger" onClick={onDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

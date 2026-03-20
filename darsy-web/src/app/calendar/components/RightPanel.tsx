"use client";
import React, { useState } from "react";
import { useCalendar } from "../context/CalendarContext";
import { MONTHS, BAND_COLORS, CAT_BAND_COLOR } from "../lib/helpers";
import type { CalEvent } from "../context/CalendarContext";
import { CalendarDays, User, Globe, CheckSquare, Plus, PenSquare, Trash2 } from "lucide-react";


function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fmtTime(t?: string) {
  if (!t) return '';
  const [h24, m] = t.split(':').map(Number);
  const p = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (!h) h = 12;
  return `${h}:${String(m).padStart(2,'0')} ${p}`;
}

const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const todayStr = fmt(TODAY);

export default function RightPanel() {
  const { events, todos, addTodo, toggleTodo, deleteTodo, openModal, deleteEvent, showGlobals, globalEvents } = useCalendar();
  const [upcTab,    setUpcTab]    = useState<'mine'|'global'>('mine');
  const [todoInput, setTodoInput] = useState('');
  const [filter,    setFilter]    = useState<'all'|'pending'|'done'>('all');

  // Upcoming personal
  const mineEvs = events
    .filter(e => !e.isGlobal && e.date >= todayStr)
    .sort((a,b) => (a.date+(a.time||'')).localeCompare(b.date+(b.time||'')))
    .slice(0, 5);

  // Upcoming global — from API, filtered by toggle
  const globalUpcoming = (showGlobals ? globalEvents : [])
    .filter(e => e.date >= todayStr)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const filteredTodos = todos.filter(t =>
    filter==='all' ? true : filter==='done' ? t.done : !t.done
  );
  const doneCount  = todos.filter(t => t.done).length;
  const progress   = todos.length > 0 ? doneCount/todos.length*100 : 0;

  const doAddTodo = () => {
    if (!todoInput.trim()) return;
    addTodo({
      id:`t-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
      label:todoInput.trim(), done:false, createdAt:new Date().toISOString(),
    });
    setTodoInput('');
  };

  const dateLabel = (dateStr: string) => {
    const tom = new Date(TODAY); tom.setDate(tom.getDate()+1);
    if (dateStr === todayStr) return { text:'Today',   color:'var(--green)' };
    if (dateStr === fmt(tom)) return { text:'Tomorrow', color:'#f97316' };
    const d = new Date(dateStr+'T00:00');
    return { text:`${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}`, color:'#6b7280' };
  };

  const renderEventCard = (ev: CalEvent) => {
    const bg  = BAND_COLORS[ev.color] || CAT_BAND_COLOR[ev.category] || '#1e293b';
    const dl  = dateLabel(ev.date);
    const d   = new Date(ev.date+'T00:00');
    return (
      <div
        key={ev.id}
        className="upcoming-item"
        onClick={() => !ev.isGlobal && openModal(ev.date, ev.id)}
        style={{ marginBottom:'8px', cursor: ev.isGlobal ? 'default' : 'pointer' }}
      >
        {/* Date box */}
        <div className="upc-date-box" style={{ background: ev.isGlobal ? 'var(--green-dim)' : bg + '22', flexShrink:0 }}>
          <div className="upc-month" style={{ color: ev.isGlobal ? 'var(--green)' : bg }}>
            {MONTHS[d.getMonth()].slice(0,3).toUpperCase()}
          </div>
          <div className="upc-day" style={{ color: ev.isGlobal ? 'var(--green)' : bg }}>
            {d.getDate()}
          </div>
        </div>
        {/* Info */}
        <div className="upc-info">
          <div className="upc-title">{ev.isGlobal && '🌍 '}{ev.title}</div>
          <div className="upc-meta">
            <span style={{ color:dl.color, fontWeight:700 }}>{dl.text}</span>
            {ev.time && <> &middot; {fmtTime(ev.time)}</>}
            {ev.category && <> &middot; {ev.category}</>}
          </div>
        </div>
        {/* Reminder pip */}
        {ev.reminder && <div className="reminder-pip" title={`Reminder: ${ev.reminderMins} min before`} />}
        {/* Actions */}
        {!ev.isGlobal && (
          <div className="upc-actions">
            <button className="icon-btn edit-btn" onClick={e => { e.stopPropagation(); openModal(ev.date, ev.id); }} title="Edit">
              <PenSquare size={14} />
            </button>
            <button className="icon-btn del-btn" onClick={e => { e.stopPropagation(); deleteEvent(ev.id); }} title="Delete">
              <Trash2 size={14} />
            </button>

          </div>
        )}
        {ev.isGlobal && (
          <span className="global-tag">Global</span>
        )}
      </div>
    );
  };

  return (
    <div className="row3-grid">

      {/* ── UPCOMING EVENTS ── */}
      <div className="cal-card row3-events" style={{ display:'flex', flexDirection:'column', height:'480px' }}>
        <div className="section-head" style={{ flexShrink:0 }}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarDays size={18} color="var(--dark)" style={{ marginRight:'8px' }} />
            Upcoming Events
          </div>

          <div className="section-badge" id="upcoming-badge">{mineEvs.length} this week</div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display:'flex', gap:'5px', background:'rgba(255,255,255,.6)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'4px', marginBottom:'14px', flexShrink:0 }}>
          {(['mine','global'] as const).map(tab => (
            <button key={tab} onClick={() => setUpcTab(tab)} style={{
              flex:1, padding:'7px 10px', borderRadius:'8px', border:'none',
              fontFamily:"'Cairo',sans-serif", fontSize:'12px', fontWeight:800,
              cursor:'pointer', transition:'all .28s cubic-bezier(.4,0,.2,1)',
              background: upcTab===tab ? 'var(--dark)' : 'transparent',
              color: upcTab===tab ? '#fff' : '#6b7280',
              boxShadow: upcTab===tab ? '0 4px 14px rgba(15,29,21,.25)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'6px',
            }}>
              {tab === 'mine' ? <User size={14} /> : <Globe size={14} />}
              {tab === 'mine' ? 'My Events' : 'Global Events'}
            </button>

          ))}
        </div>

        {/* Viewport */}
        <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
          <div style={{
            display:'flex', width:'200%', height:'100%',
            transform: upcTab==='mine' ? 'translateX(0)' : 'translateX(-50%)',
            transition:'transform .35s cubic-bezier(.4,0,.2,1)',
          }}>
            {/* Mine */}
            <div style={{ width:'50%', overflowY:'auto', paddingRight:'4px', scrollbarWidth:'thin', scrollbarColor:'var(--green-mid) transparent', display:'flex', flexDirection:'column' }}>
              {mineEvs.length === 0
                ? <div className="empty-state"><div style={{ fontSize:'18px' }}>○</div>No personal events this week</div>
                : mineEvs.map(renderEventCard)}
            </div>
            {/* Global */}
            <div style={{ width:'50%', overflowY:'auto', paddingRight:'4px', scrollbarWidth:'thin', scrollbarColor:'var(--green-mid) transparent', display:'flex', flexDirection:'column' }}>
              {globalUpcoming.length === 0
                ? <div className="empty-state"><div style={{ fontSize:'18px' }}>○</div>No global events</div>
                : globalUpcoming.map(renderEventCard)}
            </div>
          </div>
        </div>
      </div>

      {/* ── TO-DO LIST ── */}
      <div className="cal-card row3-todos" style={{ display:'flex', flexDirection:'column', height:'480px' }}>
        <div className="section-head" style={{ marginBottom:'16px' }}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center' }}>
            <CheckSquare size={18} color="var(--dark)" style={{ marginRight:'8px' }} />
            To-Do List
          </div>

        </div>

        <div className="todo-add-row" style={{ flexShrink:0 }}>
          <input
            id="todo-input"
            type="text"
            value={todoInput}
            placeholder="Add a new task…"
            onChange={e => setTodoInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter') doAddTodo(); }}
          />
          <button className="add-task-btn" onClick={doAddTodo} title="Add task">
            <Plus size={18} color="#fff" />
          </button>

        </div>

        <div className="todo-filters" style={{ flexShrink:0 }}>
          {(['all','pending','done'] as const).map(f => (
            <button key={f} className={`tf${filter===f?' active':''}`} onClick={() => setFilter(f)}>
              {f==='pending' ? '⏳ Pending' : f==='done' ? '◆ Done' : 'All'}
            </button>
          ))}
        </div>

        <div className="todo-list-wrap" style={{ flex:1 }}>
          {filteredTodos.length === 0 && (
            <div className="empty-state">
              <div>◇</div>Nothing yet — add a task above!
            </div>
          )}
          {filteredTodos.map(todo => (
            <div key={todo.id} className={`todo-item${todo.done?' done-item':''}`}>
              <button
                className={`check-btn${todo.done?' checked':''}`}
                onClick={() => toggleTodo(todo.id)}
              >
                {todo.done && '✓'}
              </button>
              <div className="todo-text">{todo.label}</div>
              <button
                className="todo-del"
                onClick={() => deleteTodo(todo.id)}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>

            </div>
          ))}
        </div>

        <div className="todo-stats-row" style={{ flexShrink:0, marginTop:'10px' }}>
          <span><span className="highlight">{doneCount}</span> done</span>
          <div className="todo-progress-wrap">
            <div className="todo-progress-bar" style={{ width:`${progress}%` }} />
          </div>
          <span><span className="highlight">{todos.length}</span> total</span>
        </div>
      </div>
    </div>
  );
}

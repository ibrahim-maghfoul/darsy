"use client";
import React, { useMemo, useRef, useEffect } from "react";
import { useCalendar } from "../../context/CalendarContext";
import { fmt, MONTHS, DAY_NAMES_FULL, BAND_COLORS, BAND_TEXT, CAT_BAND_COLOR, CAT_FALLBACK, timeToMin, addMinutes, formatDuration } from "../../lib/helpers";


const DAY_HOUR_H = 52;

export default function DayView() {
  const { viewDate, events, showGlobals, openModal, globalEvents } = useCalendar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const TODAY = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = fmt(TODAY);
  const key = fmt(viewDate);
  const isToday = key === todayStr;

  const filteredGlobals = useMemo(() => showGlobals ? globalEvents : [], [showGlobals, globalEvents]);
  const allEvs = useMemo(() => [...events, ...filteredGlobals], [events, filteredGlobals]);

  const allDayEvs   = allEvs.filter(e => e.endDate && e.endDate > e.date && key >= e.date && key <= e.endDate!);
  const allDaySingle = allEvs.filter(e => e.date === key && !!e.allDay);
  const timedEvs    = allEvs.filter(e => e.date === key && !(e.endDate && e.endDate > e.date) && !e.allDay)
    .sort((a,b) => (a.time||'00:00').localeCompare(b.time||'00:00'));

  // Greedy collision grouping
  const evTimes = timedEvs.map(ev => {
    const s = timeToMin(ev.time||'08:00');
    const endT = ev.endTime || addMinutes(ev.time||'08:00', ev.duration||60);
    return { s, e: Math.min(timeToMin(endT), 24*60) };
  });

  const evCol  = new Array(timedEvs.length).fill(0);
  const evCols = new Array(timedEvs.length).fill(1);
  const visited = new Array(timedEvs.length).fill(false);
  const groups: number[][] = [];
  for (let i = 0; i < timedEvs.length; i++) {
    if (visited[i]) continue;
    const group = [i]; visited[i] = true;
    for (let j = i+1; j < timedEvs.length; j++) {
      if (group.some(k => evTimes[j].s < evTimes[k].e && evTimes[k].s < evTimes[j].e)) {
        group.push(j); visited[j] = true;
      }
    }
    groups.push(group);
  }
  groups.forEach(group => {
    const usedSlots: number[] = [];
    group.forEach(i => {
      let col = 0;
      while (usedSlots[col] !== undefined && usedSlots[col] > evTimes[i].s) col++;
      evCol[i] = col; usedSlots[col] = evTimes[i].e;
    });
    const maxCol = Math.max(...group.map(i => evCol[i])) + 1;
    group.forEach(i => { evCols[i] = maxCol; });
  });

  // Auto-scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const nowMin = now.getHours()*60 + now.getMinutes();
    const target = isToday ? Math.max(0, nowMin/60*DAY_HOUR_H - 100) : 8*DAY_HOUR_H - 60;
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = target; }, 50);
  }, [viewDate, isToday]);

  const totalH = 24 * DAY_HOUR_H;

  return (
    <div>
      {/* Date badge */}
      <div className="day-view-header">
        <div className={`day-view-date-badge${isToday ? '' : ' not-today'}`}>
          {isToday
            ? `Today · ${MONTHS[viewDate.getMonth()]} ${viewDate.getDate()}`
            : `${MONTHS[viewDate.getMonth()]} ${viewDate.getDate()}, ${viewDate.getFullYear()}`}
        </div>
      </div>

      {/* All-day strip */}
      {(allDayEvs.length > 0 || allDaySingle.length > 0) && (
        <div className="day-all-day-strip">
          <div className="day-all-day-label">All-day</div>
          {[...allDayEvs, ...allDaySingle].map(ev => {
            const bg = BAND_COLORS[ev.color] || CAT_BAND_COLOR[ev.category] || '#1e293b';
            const tc = BAND_TEXT[ev.color] || '#fff';
            return (
              <div key={ev.id} className="day-all-day-band" style={{ background:bg, color:tc }}
                onClick={() => openModal(ev.date, ev.id)}>
                <span>{ev.isGlobal ? '🌍' : '☀️'}</span>
                <span>{ev.title}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="day-tl-scroll" ref={scrollRef}>
        <div className="day-tl-body" style={{ height:`${totalH}px` }}>
          {/* Time labels */}
          <div className="day-tl-times">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="tl-time-label" style={{ height:`${DAY_HOUR_H}px`, flexShrink:0 }}>
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
              </div>
            ))}
          </div>

          {/* Event column */}
          <div className="day-tl-col" style={{ flex:1, position:'relative', height:`${totalH}px` }}>
            {/* Hour lines */}
            {Array.from({ length: 25 }, (_, h) => (
              <div key={h} className="tl-hour-line" style={{ top:`${h*DAY_HOUR_H}px`, position:'absolute', left:0, right:0, borderTop:'1px dashed rgba(22,163,74,.12)', height:0 }} />
            ))}
            {/* Half-hour dashed */}
            {Array.from({ length: 24 }, (_, h) => (
              <div key={`h${h}`} style={{ position:'absolute', left:0, right:0, top:`${h*DAY_HOUR_H + DAY_HOUR_H/2}px`, borderTop:'1px dashed rgba(0,0,0,.05)' }} />
            ))}

            {/* Click to add */}
            <div style={{ position:'absolute', inset:0, zIndex:0 }} onClick={() => openModal(key)} />

            {/* Events */}
            {timedEvs.map((ev, idx) => {
              const { s: startMin, e: endMin } = evTimes[idx];
              if (startMin >= endMin) return null;
              const topPx    = startMin / 60 * DAY_HOUR_H;
              const heightPx = Math.max((endMin - startMin) / 60 * DAY_HOUR_H, 24);
              const durMins  = (endMin - startMin) || 60;
              const durLabel = formatDuration(durMins);
              const evColor  = ev.color || (CAT_FALLBACK[ev.category] || 'dark');
              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(ev.title)}&background=16a34a&color=fff&size=32`;

              const gutter = 2, usableW = 96;
              const w    = (usableW - gutter*(evCols[idx]-1)) / evCols[idx];
              const left = 1 + evCol[idx] * (w + gutter);

              return (
                <div key={ev.id}
                  className={`tl-event style-${evColor}`}
                  data-color={evColor}
                  style={{ position:'absolute', top:`${topPx}px`, height:`${heightPx}px`, left:`${left}%`, width:`${w}%`, zIndex:2, animation:'evPop .28s cubic-bezier(.34,1.56,.64,1) both' }}
                  onClick={e => { e.stopPropagation(); openModal(key, ev.id); }}
                >
                  {heightPx < 30 ? (
                    <div style={{ padding:'3px 7px', display:'flex', alignItems:'center', justifyContent:'center', height:'100%', position:'relative', zIndex:2 }}>
                      <div className="ev-title" style={{ fontSize:'10px', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</div>
                    </div>
                  ) : heightPx < 72 ? (
                    <div style={{ padding:'5px 8px', display:'flex', alignItems:'center', gap:'6px', position:'relative', zIndex:2, overflow:'hidden' }}>
                      <img src={avatarUrl} alt="" style={{ width:'22px', height:'22px', borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid rgba(255,255,255,.6)' }} />
                      <div className="ev-title" style={{ fontSize:'11px', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ev.title}</div>
                      {durLabel && <span className="ev-time-chip">⏱ {durLabel}</span>}
                    </div>
                  ) : (
                    <div style={{ padding:'8px 8px 6px', display:'flex', flexDirection:'column', height:'100%' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'4px', position:'relative', zIndex:2 }}>
                        <img src={avatarUrl} alt="" style={{ width:'26px', height:'26px', borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid rgba(255,255,255,.65)' }} />
                        <div className="ev-title" style={{ fontSize:'12px', fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ev.title}</div>
                      </div>
                      {ev.desc && <div className="ev-desc" style={{ fontSize:'10px', opacity:.75, overflow:'hidden', position:'relative', zIndex:2 }}>{ev.desc}</div>}
                      <div className="ev-inner-card" style={{ marginTop:'auto', position:'relative', zIndex:2 }}>
                        <span className="ev-inner-dur">⏱ {durLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Current time */}
            {isToday && (() => {
              const now = new Date();
              const topPx = (now.getHours()*60 + now.getMinutes()) / 60 * DAY_HOUR_H;
              return (
                <div className="tl-now-line" style={{ top:`${topPx}px`, left:0, width:'100%', position:'absolute', zIndex:5 }}>
                  <div className="tl-now-dot"></div>
                  <div className="tl-now-bar"></div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

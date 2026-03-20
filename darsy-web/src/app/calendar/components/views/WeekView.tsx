"use client";
import React, { useMemo, useRef, useEffect } from "react";
import { useCalendar } from "../../context/CalendarContext";
import { fmt, MONTHS, DAYS3, BAND_COLORS, BAND_TEXT, CAT_BAND_COLOR, CAT_FALLBACK, timeToMin, addMinutes, formatDuration } from "../../lib/helpers";


const TL_START = 0;
const TL_END   = 23;
const HOUR_H   = 60;

export default function WeekView() {
  const { viewDate, events, showGlobals, openModal, globalEvents } = useCalendar();
  const scrollRef = useRef<HTMLDivElement>(null);

  const TODAY = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = fmt(TODAY);
  const filteredGlobals = useMemo(() => showGlobals ? globalEvents : [], [showGlobals, globalEvents]);

  // Build the 7-day range
  const weekDays = useMemo(() => {
    const days = [];
    const wS = new Date(viewDate); wS.setDate(wS.getDate() - wS.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(wS); d.setDate(wS.getDate() + i);
      days.push({ date: d, key: fmt(d), label: `${DAYS3[d.getDay()]} ${d.getDate()}` });
    }
    return days;
  }, [viewDate]);

  const wSKey = weekDays[0].key;
  const wEKey = weekDays[6].key;

  const allEvs = useMemo(() => [...events, ...filteredGlobals], [events, filteredGlobals]);


  // Multi-day banner events spanning this week
  const multiDayEvs = useMemo(() =>
    allEvs.filter(ev => ev.endDate && ev.endDate > ev.date && ev.date <= wEKey && ev.endDate >= wSKey),
  [allEvs, wSKey, wEKey]);

  // Auto-scroll to now / 8AM
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const isThisWeek = todayStr >= wSKey && todayStr <= wEKey;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const target = isThisWeek
      ? Math.max(0, (nowMin - TL_START * 60) / 60 * HOUR_H - 100)
      : Math.max(0, (8 * 60 - TL_START * 60) / 60 * HOUR_H - 60);
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = target; }, 50);
  }, [viewDate, todayStr, wSKey, wEKey]);

  const totalH = (TL_END - TL_START) * HOUR_H;

  return (
    <div className="week-timeline">
      {/* Column headers */}
      <div className="week-tl-header" style={{ gridTemplateColumns: '48px repeat(7,1fr)' }}>
        <div></div>
        {weekDays.map(({ date, key, label }) => (
          <div key={key} className={`week-tl-col-hdr${key === todayStr ? ' today-hdr' : ''}`}>
            <div className="hdr-day">{DAYS3[date.getDay()]}</div>
            <div className="hdr-num">{date.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Multi-day strip */}
      {multiDayEvs.length > 0 && (
        <div style={{ position:'relative', marginBottom:'8px', height:`${multiDayEvs.length * 25 + 4}px`, display:'flex' }}>
          <div style={{ width:'48px', flexShrink:0, fontSize:'9px', fontWeight:800, color:'#9ca3af', textAlign:'right', paddingRight:'8px', paddingTop:'6px' }}>
            ALL DAY
          </div>
          <div style={{ flex:1, position:'relative' }}>
            {weekDays.map((_, i) => (
              <div key={i} style={{ position:'absolute', top:0, bottom:0, left:`${i*100/7}%`, width:'1px', background:'rgba(22,163,74,.06)' }} />
            ))}
            {multiDayEvs.map((ev, rowIdx) => {
              const visStart = ev.date < wSKey ? wSKey : ev.date;
              const visEnd   = ev.endDate! > wEKey ? wEKey : ev.endDate!;
              const startIdx = weekDays.findIndex(d => d.key === visStart);
              const endIdx   = weekDays.findIndex(d => d.key === visEnd);
              if (startIdx < 0 || endIdx < 0) return null;
              const colW = 100/7;
              const bg = BAND_COLORS[ev.color] || CAT_BAND_COLOR[ev.category] || '#1e293b';
              const tc = BAND_TEXT[ev.color] || '#fff';
              return (
                <div key={ev.id} onClick={e => { e.stopPropagation(); openModal(ev.date, ev.id); }} style={{
                  position:'absolute', left:`calc(${startIdx*colW}% + 3px)`,
                  width:`calc(${(endIdx-startIdx+1)*colW}% - 6px)`, top:`${rowIdx*25+2}px`, height:'22px',
                  background:bg, color:tc, borderRadius:'4px', fontSize:'10px', fontWeight:800,
                  padding:'0 8px', display:'flex', alignItems:'center', gap:'5px',
                  whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', cursor:'pointer',
                  boxShadow:'0 2px 8px rgba(0,0,0,.15)', transition:'opacity .15s',
                }}>
                  <span>{ev.isGlobal ? '🌍' : '📌'}</span>
                  <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrollable body */}
      <div className="day-tl-scroll" style={{ height:'560px' }} ref={scrollRef}>
        <div className="week-tl-body" style={{ height:`${totalH + 20}px` }}>
          {/* Time gutter */}
          <div className="week-tl-times">
            {Array.from({ length: TL_END - TL_START + 1 }, (_, h) => TL_START + h).map(h => (
              <div key={h} className="tl-time-label">
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="week-tl-cols" style={{ gridTemplateColumns:`repeat(7,1fr)`, display:'grid', height:`${totalH}px`, position:'relative' }}>
            {/* Hour lines */}
            <div className="tl-hour-lines">
              {Array.from({ length: TL_END - TL_START + 1 }, (_, i) => (
                <div key={i} className="tl-hour-line" style={{ top:`${i * HOUR_H}px` }} />
              ))}
            </div>

            {weekDays.map(({ date, key }) => {
              const isToday = key === todayStr;
              const dayEvs = allEvs.filter(e =>
                e.date === key && !(e.endDate && e.endDate > e.date)
              ).sort((a, b) => (a.time||'00:00').localeCompare(b.time||'00:00'));

              return (
                <div key={key} className={`tl-day-col${isToday ? ' today-col-tl' : ''}`}
                  style={{ height:`${totalH}px` }} onClick={() => openModal(key)}>
                  {dayEvs.map((ev, idx) => {
                    const evColor = ev.color || (CAT_FALLBACK[ev.category] || 'dark');
                    const startMin = timeToMin(ev.time || '08:00');
                    const endT = ev.endTime || addMinutes(ev.time||'08:00', ev.duration||60);
                    const endMin = timeToMin(endT);
                    const clampedStart = Math.max(startMin, TL_START*60);
                    const clampedEnd   = Math.min(endMin,   TL_END*60);
                    if (clampedStart >= clampedEnd) return null;
                    const topPx    = (clampedStart - TL_START*60) / 60 * HOUR_H;
                    const heightPx = Math.max((clampedEnd - clampedStart) / 60 * HOUR_H, 22);
                    const durMins  = Math.max(timeToMin(endT) - startMin, 0) || ev.duration || 60;
                    const durLabel = formatDuration(durMins);
                    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(ev.title)}&background=16a34a&color=fff&size=32`;


                    // Simple overlap: count concurrent events
                    const overlapping = dayEvs.filter(o => {
                      const os = timeToMin(o.time||'08:00');
                      const oe = timeToMin(o.endTime || addMinutes(o.time||'08:00', o.duration||60));
                      return os < endMin && startMin < oe;
                    });
                    const totalCols = overlapping.length;
                    const colIdx    = overlapping.indexOf(ev);
                    const w    = (96 - 2*(totalCols-1)) / totalCols;
                    const left = 1 + colIdx * (w + 2);

                    return (
                      <div key={ev.id}
                        className={`tl-event style-${evColor}`}
                        data-color={evColor}
                        style={{ top:`${topPx}px`, height:`${heightPx}px`, left:`${left}%`, width:`${w}%`, animation:'evPop .28s cubic-bezier(.34,1.56,.64,1) both' }}
                        onClick={e => { e.stopPropagation(); openModal(key, ev.id); }}
                      >
                        {heightPx < 30 ? (
                          <div className="ev-title tiny">{ev.title}</div>
                        ) : heightPx < 72 ? (
                          <div className="ev-top-row" style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 8px', position:'relative', zIndex:2, width:'100%', overflow:'hidden' }}>
                            <img className="ev-avatar" src={avatarUrl} alt="" style={{ width:'22px', height:'22px', borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid rgba(255,255,255,.6)' }} />
                            <div className="ev-title" style={{ fontSize:'11px', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ev.title}</div>
                            {durLabel && <span className="ev-time-chip">⏱ {durLabel}</span>}
                          </div>
                        ) : (
                          <div style={{ padding:'8px 8px 6px', display:'flex', flexDirection:'column', gap:0, height:'100%' }}>
                            <div className="ev-top-row" style={{ display:'flex', alignItems:'center', gap:'7px', width:'100%', marginBottom:'4px', position:'relative', zIndex:2 }}>
                              <img className="ev-avatar" src={avatarUrl} alt="" style={{ width:'26px', height:'26px', borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid rgba(255,255,255,.65)' }} />
                              <div className="ev-title" style={{ fontSize:'12px', fontWeight:900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ev.title}</div>
                            </div>
                            {ev.desc && <div className="ev-desc" style={{ fontSize:'10px', opacity:.75, position:'relative', zIndex:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.desc}</div>}
                            <div className="ev-inner-card" style={{ marginTop:'auto', position:'relative', zIndex:2 }}>
                              <span className="ev-inner-dur">⏱ {durLabel}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Current time line */}
                  {isToday && (() => {
                    const now = new Date();
                    const nowMin = now.getHours()*60 + now.getMinutes();
                    if (nowMin < TL_START*60 || nowMin > TL_END*60) return null;
                    const topPx = (nowMin - TL_START*60) / 60 * HOUR_H;
                    return (
                      <div className="tl-now-line" style={{ top:`${topPx}px`, left:0, right:0 }}>
                        <div className="tl-now-dot"></div>
                        <div className="tl-now-bar"></div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

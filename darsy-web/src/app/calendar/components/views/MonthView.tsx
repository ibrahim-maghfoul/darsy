"use client";
import React, { useMemo } from "react";
import { useCalendar } from "../../context/CalendarContext";
import { fmt, BAND_COLORS, BAND_TEXT, CAT_BAND_COLOR, CAT_CLS } from "../../lib/helpers";


export default function MonthView() {
  const { viewDate, events, showGlobals, openModal, globalEvents } = useCalendar();
  const TODAY = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = fmt(TODAY);

  const filteredGlobals = useMemo(() => showGlobals ? globalEvents : [], [showGlobals, globalEvents]);
  const allEvs = useMemo(() => [...events, ...filteredGlobals], [events, filteredGlobals]);


  const { year, month, cells } = useMemo(() => {
    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month+1, 0);
    const startDay = first.getDay();

    const cells: { date: Date; key: string; other: boolean }[] = [];
    for (let i = 0; i < startDay; i++) {
      const d = new Date(first); d.setDate(d.getDate() - (startDay - i));
      cells.push({ date: d, key: fmt(d), other: true });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, key: fmt(dt), other: false });
    }
    const total = cells.length;
    const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= rem; i++) {
      const d = new Date(last); d.setDate(d.getDate() + i);
      cells.push({ date: d, key: fmt(d), other: true });
    }
    return { year, month, cells };
  }, [viewDate]);

  const multiDay = useMemo(() =>
    allEvs.filter(e => e.endDate && e.endDate > e.date),
  [allEvs]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="day-headers">
        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
          <div key={d} className="day-hdr">{d}</div>
        ))}
      </div>
      <div className="month-grid-wrap">
        <div className="month-grid">
          {cells.map(({ date, key, other }) => {
            const isToday = key === todayStr;

            // Multi-day bands for this cell
            const bands = multiDay.filter(e => key >= e.date && key <= e.endDate!);
            const hasBand = bands.length > 0;

            // Single-day events for this cell
            const dayEvs = allEvs.filter(e =>
              e.date === key && !(e.endDate && e.endDate > e.date)
            );

            return (
              <div
                key={key}
                className={`cal-cell${other ? ' other-month' : ''}${isToday ? ' today' : ''}`}
                onClick={() => openModal(key)}
              >
                {/* Top row: number + band container */}
                <div className={`cell-top-row${hasBand ? ' has-band' : ''}`}>
                  <div className="cell-num">{date.getDate()}</div>
                  <div className="multiday-bands">
                    {bands.map(ev => {
                      const isStart = key === ev.date;
                      const isEnd   = key === ev.endDate;
                      const isSolo  = isStart && isEnd;
                      const showTitle = isStart || new Date(key+'T00:00').getDay() === 0;
                      const bg = BAND_COLORS[ev.color] || CAT_BAND_COLOR[ev.category] || '#1e293b';
                      const tc = BAND_TEXT[ev.color] || '#fff';
                      let cls = 'mday-band ';
                      if (isSolo) cls += 'band-solo';
                      else if (isStart) cls += 'band-start';
                      else if (isEnd)   cls += 'band-end';
                      else              cls += 'band-mid';
                      return (
                        <div
                          key={ev.id}
                          className={cls}
                          style={{ background: bg, color: tc }}
                          onClick={e => { e.stopPropagation(); openModal(ev.date, ev.id); }}
                        >
                          {showTitle ? `${ev.isGlobal ? '🌍 ' : ''}${ev.title}` : ''}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Single-day event pills */}
                <div className="cell-events">
                  {dayEvs.slice(0,2).map(ev => {
                    const extraStyle = ev.isGlobal
                      ? { background:'#dbeafe', color:'#1e40af', borderLeft:'3px solid #3b82f6' }
                      : undefined;
                    return (
                      <div
                        key={ev.id}
                        className={`epill ${CAT_CLS[ev.category] || 'c-learning'}`}
                        style={extraStyle}
                        title={ev.desc || ev.title}
                        onClick={e => { e.stopPropagation(); openModal(key, ev.id); }}
                      >
                        <span className="epill-text">
                          {ev.isGlobal ? '🌍 ' : ev.allDay ? '☀️ ' : ''}
                          {ev.title}
                        </span>
                        <span className="epill-letter">{ev.title.trim()[0] || '?'}</span>
                        {ev.desc && <span className="epill-desc">{ev.desc}</span>}
                      </div>
                    );
                  })}
                  {dayEvs.length > 2 && (
                    <div className="more-label">+{dayEvs.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

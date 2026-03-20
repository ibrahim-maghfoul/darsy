"use client";
import React, { useMemo } from "react";
import { useCalendar } from "../../context/CalendarContext";
import { fmt, MONTHS } from "../../lib/helpers";

export default function YearView() {
  const { viewDate, events, openModal } = useCalendar();
  const TODAY = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const todayStr = fmt(TODAY);
  const year = viewDate.getFullYear();

  return (
    <div className="year-grid">
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(year, m, 1);
        const last  = new Date(year, m+1, 0);
        const blanks = first.getDay();
        return (
          <div key={m} className="mini-month">
            <div className="mini-title">{MONTHS[m].slice(0,3)} {year}</div>
            <div className="mini-grid">
              {['S','M','T','W','T','F','S'].map((d,i) => (
                <div key={i} className="m-cell m-hdr">{d}</div>
              ))}
              {Array.from({ length: blanks }, (_, i) => (
                <div key={`b${i}`} className="m-cell" />
              ))}
              {Array.from({ length: last.getDate() }, (_, i) => {
                const dd  = i + 1;
                const dt  = new Date(year, m, dd);
                const key = fmt(dt);
                const isT = key === todayStr;
                const hasEv = events.some(e => e.date === key);
                return (
                  <div
                    key={dd}
                    className={`m-cell${isT ? ' m-today' : ''}${hasEv && !isT ? ' m-event' : ''}`}
                    title={hasEv ? events.filter(e => e.date===key).map(e => e.title).join(', ') : ''}
                    onClick={e => { e.stopPropagation(); openModal(key); }}
                  >
                    {dd}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

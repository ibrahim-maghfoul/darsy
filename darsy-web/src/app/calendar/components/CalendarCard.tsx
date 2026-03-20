"use client";
import React, { useState, useEffect } from "react";
import { useCalendar } from "../context/CalendarContext";
import { MONTHS } from "../lib/helpers";
import DatePicker from "./DatePicker";
import MonthView from "./views/MonthView";
import WeekView  from "./views/WeekView";
import DayView   from "./views/DayView";
import YearView  from "./views/YearView";
import { ChevronLeft, ChevronRight, Globe } from "lucide-react";


type View = "month"|"week"|"day"|"year";

export default function CalendarCard() {
  const { curView, setCurView, viewDate, setViewDate, showGlobals, toggleGlobals } = useCalendar();
  const [animKey, setAnimKey] = useState(0); // increment to trigger anim-in



  const TODAY = new Date(); TODAY.setHours(0,0,0,0);

  const titleText = (() => {
    if (curView === 'month') return `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    if (curView === 'week') {
      const wS = new Date(viewDate); wS.setDate(wS.getDate() - wS.getDay());
      const wE = new Date(wS); wE.setDate(wS.getDate()+6);
      return `${MONTHS[wS.getMonth()].slice(0,3)} ${wS.getDate()} — ${MONTHS[wE.getMonth()].slice(0,3)} ${wE.getDate()}, ${wE.getFullYear()}`;
    }
    if (curView === 'day') {
      const WDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      return `${WDAYS[viewDate.getDay()]}, ${MONTHS[viewDate.getMonth()]} ${viewDate.getDate()}, ${viewDate.getFullYear()}`;
    }
    return String(viewDate.getFullYear());
  })();

  const prev = () => {
    const d = new Date(viewDate);
    if (curView==='month') d.setMonth(d.getMonth()-1);
    else if (curView==='week') d.setDate(d.getDate()-7);
    else if (curView==='day')  d.setDate(d.getDate()-1);
    else d.setFullYear(d.getFullYear()-1);
    setViewDate(d);
    setAnimKey(k => k+1);
  };
  const next = () => {
    const d = new Date(viewDate);
    if (curView==='month') d.setMonth(d.getMonth()+1);
    else if (curView==='week') d.setDate(d.getDate()+7);
    else if (curView==='day')  d.setDate(d.getDate()+1);
    else d.setFullYear(d.getFullYear()+1);
    setViewDate(d);
    setAnimKey(k => k+1);
  };
  const goToday = () => { setViewDate(new Date(TODAY)); setAnimKey(k => k+1); };

  const switchView = (v: View) => {
    if (v === curView) return;
    setCurView(v);
    setAnimKey(k => k+1);
  };

  const [gotoDate, setGotoDate] = useState<string>('');
  const handleGoto = (date: string) => {
    setGotoDate(date);
    const d = new Date(date+'T00:00:00');
    if (!isNaN(d.getTime())) { setViewDate(d); setAnimKey(k => k+1); }
  };

  const views: { id: View; label: string }[] = [

    { id:'month', label:'Month' },
    { id:'week',  label:'Week'  },
    { id:'day',   label:'Day'   },
  ];

  return (
    <>
      <div className="cal-card" id="cal-card" style={{ flex:1, minWidth:0 }}>
        {/* ── Navigation Bar ── */}
        <div className="cal-nav">
          <div className="cal-nav-left">
            <button className="nav-btn" onClick={prev}>
              <ChevronLeft size={16} color="var(--dark)" />
            </button>

            <div className="cal-title">{titleText}</div>
            <button className="nav-btn" onClick={next}>
              <ChevronRight size={16} color="var(--dark)" />
            </button>

            <button className="today-btn" onClick={goToday}>Today</button>
          </div>

          <div className="cal-nav-right">
            {/* GoTo date picker */}
            <DatePicker

              value={gotoDate}
              onChange={handleGoto}
              placeholder="Pick a date"
              dropdownAlign="right"
            />

            {/* Globals toggle */}
            <button
              className={`globals-toggle${showGlobals?' on':''}`}
              id="globals-toggle-btn"
              onClick={toggleGlobals}
            >
              <Globe size={14} />
              <span>Global</span>
              <div className="toggle-pill" id="globals-pill">

                <div className="toggle-thumb"></div>
              </div>
            </button>
          </div>

          {/* View Tabs */}
          <div className="view-tabs">
            {views.map(v => (
              <button
                key={v.id}
                className={`vtab${curView===v.id?' active':''}`}
                onClick={() => switchView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── View Content with slide animation ── */}
        <div style={{ position:'relative', overflow:'hidden' }}>
          {curView === 'month' && (
            <div key={`month-${animKey}`} className="vpage active anim-in" id="vpage-month">
              <MonthView />
            </div>
          )}
          {curView === 'week' && (
            <div key={`week-${animKey}`} className="vpage active anim-in" id="vpage-week">
              <WeekView />
            </div>
          )}
          {curView === 'day' && (
            <div key={`day-${animKey}`} className="vpage active anim-in" id="vpage-day">
              <DayView />
            </div>
          )}
          {curView === 'year' && (
            <div key={`year-${animKey}`} className="vpage active anim-in" id="vpage-year">
              <YearView />
            </div>
          )}
        </div>
      </div>
    </>
  );
}


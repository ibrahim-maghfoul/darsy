"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock, ChevronDown } from "lucide-react";

import { createPortal } from "react-dom";

interface TimePickerProps {
  value?: string;   // "HH:MM" 24h
  onChange: (val: string) => void;
  label?: string;
}

function to12(h24: number): { h: number; period: 'AM'|'PM' } {
  const p = h24 < 12 ? 'AM' : 'PM';
  let h = h24 % 12; if (h === 0) h = 12;
  return { h, period: p };
}
function toFmt(val: string | undefined): string {
  if (!val) return "Select time";
  const [h24, m] = val.split(':').map(Number);
  const { h, period } = to12(h24);
  return `${h}:${String(m).padStart(2,'0')} ${period}`;
}
function to24(h: number, period: 'AM'|'PM'): number {
  if (period === 'AM') return h === 12 ? 0 : h;
  return h === 12 ? 12 : h + 12;
}

const CX = 105, CY = 105, R = 82;
const HOUR_NUMS  = [12,1,2,3,4,5,6,7,8,9,10,11];
const MIN_STEPS  = [0,5,10,15,20,25,30,35,40,45,50,55];

function angleForHour(h: number) {
  const idx = h === 12 ? 0 : h;
  return (idx / 12) * 360 - 90;
}
function angleForMin(m: number) {
  return (m / 60) * 360 - 90;
}
function snapHour(deg: number): number {
  // deg in 0–360, snap to nearest hour
  const norm = ((deg + 90) % 360 + 360) % 360;
  const h = Math.round(norm / 30) % 12;
  return h === 0 ? 12 : h;
}
function snapMin(deg: number): number {
  const norm = ((deg + 90) % 360 + 360) % 360;
  return Math.round(norm / 6) % 60;
}

function polarAngle(svgEl: SVGElement, clientX: number, clientY: number): number {
  const rect = svgEl.getBoundingClientRect();
  const scaleX = 210 / rect.width;
  const scaleY = 210 / rect.height;
  const dx = (clientX - rect.left) * scaleX - CX;
  const dy = (clientY - rect.top)  * scaleY - CY;
  return Math.atan2(dy, dx) * 180 / Math.PI; // -180..180
}

function HandLine({ angleDeg, isDragging }: { angleDeg: number, isDragging: boolean }) {
  const totalRef = useRef(angleDeg);
  const prevRef = useRef(angleDeg);

  if (angleDeg !== prevRef.current) {
    let delta = angleDeg - prevRef.current;
    // Normalize delta to [-180, 180] to find shortest rotational distance
    delta = ((delta + 180) % 360 + 360) % 360 - 180;
    totalRef.current += delta;
    prevRef.current = angleDeg;
  }

  return (
    <g
      style={{
        transform: `rotate(${totalRef.current}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      <line x1={CX} y1={CY} x2={CX + R - 4} y2={CY}
        stroke="var(--green)" strokeWidth="5" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="5" fill="var(--green)" />
      <circle cx={CX + R} cy={CY} r="16" fill="var(--green)" opacity="0.22" />
    </g>
  );
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'hour'|'min'>('hour');
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const parseVal = () => {
    if (!value) return { h: 12, m: 0, period: 'AM' as const };
    const [h24, min] = value.split(':').map(Number);
    const { h, period } = to12(h24);
    return { h, m: min, period };
  };
  const pv = parseVal();
  const [hour,   setHour]   = useState(pv.h);
  const [minute, setMinute] = useState(pv.m);
  const [period, setPeriod] = useState<'AM'|'PM'>(pv.period);

  useEffect(() => {
    if (value) {
      const { h, m, period: p } = parseVal();
      setHour(h); setMinute(m); setPeriod(p as 'AM'|'PM');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleOpen = () => { setMode('hour'); setOpen(true); };
  const handleDone = () => {
    const h24 = to24(hour, period);
    onChange(`${String(h24).padStart(2,'0')}:${String(minute).padStart(2,'0')}`);
    setOpen(false);
  };

  // ── Drag / click on SVG clock ──
  const pointerDownFlag = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointerDownFlag.current = true;
    dragging.current = false; // Initial click gets transition
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    applyDrag(e.currentTarget, e.clientX, e.clientY, false);
  }, [mode]); // eslint-disable-line

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointerDownFlag.current) return;
    dragging.current = true; // Subsequent moves snap instantly
    applyDrag(e.currentTarget, e.clientX, e.clientY, false);
  }, [mode]); // eslint-disable-line

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointerDownFlag.current) return;
    pointerDownFlag.current = false;
    dragging.current = false;
    applyDrag(e.currentTarget, e.clientX, e.clientY, true);
  }, [mode]); // eslint-disable-line

  const applyDrag = (svgEl: SVGSVGElement, cx: number, cy: number, finalize: boolean) => {
    const angle = polarAngle(svgEl, cx, cy);
    if (mode === 'hour') {
      const h = snapHour(angle);
      setHour(h);
      if (finalize) setTimeout(() => setMode('min'), 350);
    } else {
      const m = snapMin(angle);
      setMinute(m);
    }
  };

  const handleNumberClick = (n: number) => {
    if (mode === 'hour') { setHour(n); setTimeout(() => setMode('min'), 350); }
    else setMinute(n);
  };

  const handAngle = mode === 'hour' ? angleForHour(hour) : angleForMin(minute);
  
  // Progress Ring Arc Length
  const sweptAngle = ((handAngle + 90) % 360 + 360) % 360; 
  const circumference = 2 * Math.PI * R;
  const arcLen = (sweptAngle / 360) * circumference;

  const displayText = toFmt(value);

  const clockItems = mode === 'hour'
    ? HOUR_NUMS.map((n, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const displayNum = period === 'PM' ? (n === 12 ? '00' : n + 12) : n;
        return { n, displayNum, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle), isSelected: n === hour };
      })
    : MIN_STEPS.map((n, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        return { n, displayNum: mode === 'min' ? String(n).padStart(2,'0') : n, x: CX + R * Math.cos(angle), y: CY + R * Math.sin(angle), isSelected: n === minute };
      });

  const overlay = open ? createPortal(
    <div className="tp-overlay open" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="tp-card">
        <div className="tp-card-title">{label || 'Select Time'}</div>

        {/* Time display */}
        <div className="tp-times-row">
          <div className={`tp-time-big${mode==='hour'?' selecting':''}`} onClick={() => setMode('hour')}>
            {period === 'PM' ? (hour === 12 ? '00' : String(hour + 12)) : String(hour).padStart(2, '0')}
          </div>
          <div className="tp-colon">:</div>
          <div className={`tp-time-big${mode==='min'?' selecting':''}`} onClick={() => setMode('min')}>
            {String(minute).padStart(2,'0')}
          </div>
          <div className="tp-period-toggle">
            <button className={`tp-period-btn${period==='AM'?' active':''}`} onClick={() => setPeriod('AM')}>AM</button>
            <button className={`tp-period-btn${period==='PM'?' active':''}`} onClick={() => setPeriod('PM')}>PM</button>
          </div>
        </div>

        {/* SVG Clock face — draggable */}
        <div className="tp-clock" id="tp-clock" style={{ cursor:'grab' }}>
          <svg
            ref={svgRef}
            viewBox="0 0 210 210"
            style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:1, cursor:'grab' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Base Thicker Lighter Grey Track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f8fafc" strokeWidth="28" />

            {/* Green Filling Arc Tracking The Time */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--green)" strokeWidth="28" opacity="0.15"
               strokeDasharray={`${arcLen} ${circumference}`}
               strokeLinecap="round"
               style={{
                 transform: 'rotate(-90deg)',
                 transformOrigin: `${CX}px ${CY}px`,
                 transition: dragging.current ? 'none' : 'stroke-dasharray 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s'
               }}
            />

            <HandLine angleDeg={handAngle} isDragging={dragging.current} />

            {clockItems.map(({ n, displayNum, x, y, isSelected }) => (
              <g key={n} style={{ cursor:'pointer' }} onClick={e => { e.stopPropagation(); handleNumberClick(n); }}>
                <circle cx={x} cy={y} r="14" fill={isSelected ? 'var(--green)' : 'transparent'} />
                <circle cx={x} cy={y} r="14" fill="transparent" stroke="transparent" strokeWidth="8" />
                <text
                  x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight="800" fontFamily="Cairo,sans-serif"
                  fill={isSelected ? '#fff' : '#6b7280'}
                  style={{ pointerEvents:'none', userSelect:'none' }}
                >
                  {displayNum}
                </text>
              </g>
            ))}
          </svg>
          <div className="tp-clock-inner" id="tp-center-label">{period}</div>
        </div>

        <div className="tp-footer">
          <button className="tp-cancel-btn" onClick={() => setOpen(false)}>Cancel</button>
          <button className="tp-done-btn" onClick={handleDone}>Done</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <div
        className={`tp-trigger${open ? ' active' : ''}`}
        onClick={handleOpen}
      >
        <Clock size={14} style={{ opacity:.45 }} />
        <span style={{ flex:1, fontSize:'14px', fontWeight:700, color:'var(--dark)' }}>{displayText}</span>
        <ChevronDown size={14} className="tp-caret" />
      </div>

      {overlay}
    </>
  );
}

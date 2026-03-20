// Re-export types from calendarService for use in components
export type { CalEvent, Todo } from "@/services/calendar";

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAYS3 = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const DAY_NAMES_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export const BAND_COLORS: Record<string,string> = {dark:'#1e293b',blue:'#3b82f6',green:'#16a34a',orange:'#f97316',red:'#ef4444',purple:'#8b5cf6',pink:'#ec4899',teal:'#14b8a6',white:'#e2e8f0'};
export const BAND_TEXT: Record<string,string>   = {dark:'#fff',blue:'#fff',green:'#fff',orange:'#fff',red:'#fff',purple:'#fff',pink:'#fff',teal:'#fff',white:'#334155'};
export const CAT_BAND_COLOR: Record<string,string> = {class:'#1e293b',learning:'#3b82f6',deadline:'#ef4444',personal:'#16a34a',reminder:'#8b5cf6'};
export const CAT_CLS: Record<string,string> = {class:'c-class',learning:'c-learning',deadline:'c-deadline',personal:'c-personal',reminder:'c-reminder'};
export const CAT_ICO: Record<string,string> = {class:'📚',learning:'🎓',deadline:'⚡',personal:'⭐',reminder:'🔔',meeting:'💼',health:'🏥',sport:'🏃',travel:'✈️',other:'📌'};
export const CAT_FALLBACK: Record<string,string> = {class:'dark',learning:'blue',deadline:'orange',personal:'green',reminder:'purple'};

export function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function fmtDisplay(d: Date): string {
  return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
}
export function timeToMin(t: string): number {
  if (!t) return 8*60;
  const [h,m] = (t||'08:00').split(':').map(Number);
  return h*60+(m||0);
}
export function addMinutes(t: string, mins: number): string {
  const total = timeToMin(t) + mins;
  const h = Math.floor(total/60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
export function formatTimeDisplay(t: string): string {
  if (!t) return '';
  const [h,m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h%12 || 12;
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
}
export function formatDuration(mins: number): string {
  if (!mins || mins <= 0) return '';
  const h = Math.floor(mins/60);
  const m = mins%60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

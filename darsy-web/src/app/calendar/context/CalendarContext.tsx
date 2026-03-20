"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { CalEvent, Todo, calendarService } from "@/services/calendar";
import { useAuth } from "@/contexts/AuthContext";

export type { CalEvent, Todo };

export type ModalState = {
  open: boolean;
  editId?: string;
  defaultDate?: string;
};

interface CalendarCtx {
  // Drawer
  drawerOpen: boolean;
  setDrawerOpen: (b: boolean) => void;

  // Navigation
  curView: "month"|"week"|"day"|"year";
  setCurView: (v: "month"|"week"|"day"|"year") => void;
  viewDate: Date;
  setViewDate: (d: Date) => void;
  // Events
  events: CalEvent[];
  addEvent:    (e: CalEvent) => void;
  updateEvent: (e: CalEvent) => void;
  deleteEvent: (id: string)  => void;
  // Todos
  todos: Todo[];
  addTodo:    (t: Todo)   => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  // Globals
  globalEvents: CalEvent[];
  showGlobals: boolean;
  toggleGlobals: () => void;
  // Modal
  modal: ModalState;
  openModal:  (date?: string, id?: string) => void;
  closeModal: () => void;
  // Confirm
  confirmOpen: boolean;
  confirmMsg:  string;
  openConfirm:  (msg: string, cb: () => void) => void;
  closeConfirm: () => void;
  confirmOk:    () => void;
  // Snackbar
  snackbar: (title: string, sub?: string, icon?: string) => void;
  // Loading
  isLoading: boolean;
}

const Ctx = createContext<CalendarCtx | undefined>(undefined);

// Seed events so the app has demo data on first login
function seedEvents(today: Date): CalEvent[] {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const offset = (n: number): Date => { const d = new Date(today); d.setDate(d.getDate()+n); return d; };
  return [
    { id:'s1', title:'Math Class',      date: fmt(offset(1)), time:'09:00', endTime:'10:30', duration:90,  category:'class',    color:'dark',   createdAt: new Date().toISOString() },
    { id:'s2', title:'Team Stand-up',   date: fmt(today),     time:'10:00', endTime:'10:30', duration:30,  category:'meeting',  color:'blue',   createdAt: new Date().toISOString() },
    { id:'s3', title:'React Workshop',  date: fmt(offset(2)), time:'14:00', endTime:'16:00', duration:120, category:'learning', color:'purple', createdAt: new Date().toISOString() },
    { id:'s4', title:'Project Deadline',date: fmt(offset(3)), allDay:true,                                  category:'deadline', color:'red',    createdAt: new Date().toISOString() },
    { id:'s5', title:'Spring Break',    date: fmt(offset(5)), endDate: fmt(offset(9)),                      category:'personal', color:'teal',   createdAt: new Date().toISOString() },
  ];
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const TODAY = new Date(); TODAY.setHours(0,0,0,0);
  const { isAuthenticated } = useAuth();

  const [curView,      setCurView]     = useState<"month"|"week"|"day"|"year">("month");
  const [viewDate,     setViewDate]    = useState<Date>(new Date(TODAY));
  const [events,       setEvents]      = useState<CalEvent[]>([]);
  const [todos,        setTodos]       = useState<Todo[]>([]);
  const [globalEvents, setGlobalEvents]= useState<CalEvent[]>([]);
  const [showGlobals,  setShowGlobals] = useState(true);
  const [drawerOpen,   setDrawerOpen]  = useState(false);
  const [modal,        setModal]       = useState<ModalState>({ open: false });

  const [confirm,      setConfirm]     = useState<{ open:boolean; msg:string; cb?:()=>void }>({ open:false, msg:'' });
  const [snacks,       setSnacks]      = useState<{ id:string; title:string; sub?:string; icon?:string }[]>([]);
  const [isLoading,    setIsLoading]   = useState(true);

  // Load user calendar from API
  useEffect(() => {
    if (!isAuthenticated) { setIsLoading(false); return; }
    const load = async () => {
      try {
        setIsLoading(true);
        const [calData, globals] = await Promise.all([
          calendarService.getCalendar(),
          calendarService.getGlobalEvents(),
        ]);
        // Use seed events if user has never saved any
        const userEvents = calData.events.length > 0 ? calData.events : seedEvents(TODAY);
        if (calData.events.length === 0 && userEvents.length > 0) {
          // Persist seed data to DB so they have initial data
          calendarService.syncCalendar(userEvents, []).catch(() => {});
        }
        setEvents(userEvents);
        setTodos(calData.todos || []);
        setGlobalEvents(globals);
      } catch (err) {
        console.error('Failed to load calendar:', err);
        setEvents(seedEvents(TODAY));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  // ── Events CRUD (optimistic + API) ──────────────────────────────────────────
  const addEvent = useCallback((e: CalEvent) => {
    setEvents(p => [...p, e]);
    calendarService.addEvent(e).catch(() => {
      setEvents(p => p.filter(x => x.id !== e.id));
    });
  }, []);

  const updateEvent = useCallback((e: CalEvent) => {
    setEvents(p => p.map(x => x.id === e.id ? e : x));
    calendarService.updateEvent(e).catch(() => {});
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(p => p.filter(x => x.id !== id));
    calendarService.deleteEvent(id).catch(() => {});
  }, []);

  // ── Todos CRUD (optimistic + API) ───────────────────────────────────────────
  const addTodo = useCallback((t: Todo) => {
    setTodos(p => [...p, t]);
    calendarService.addTodo(t).catch(() => {
      setTodos(p => p.filter(x => x.id !== t.id));
    });
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(p => p.map(t => t.id === id ? {
      ...t, done: !t.done,
      completedAt: !t.done ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    } : t));
    calendarService.toggleTodo(id).catch(() => {});
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(p => p.filter(t => t.id !== id));
    calendarService.deleteTodo(id).catch(() => {});
  }, []);

  const toggleGlobals = useCallback(() => setShowGlobals(v => !v), []);

  const openModal  = useCallback((date?: string, id?: string) => {
    if (id && globalEvents.some(e => e.id === id)) return;
    setModal({ open:true, editId:id, defaultDate:date });
  }, [globalEvents]);
  const closeModal = useCallback(() => setModal({ open:false }), []);

  const openConfirm  = useCallback((msg: string, cb: () => void) => setConfirm({ open:true, msg, cb }), []);
  const closeConfirm = useCallback(() => setConfirm(p => ({ ...p, open:false })), []);
  const confirmOk    = useCallback(() => { confirm.cb?.(); setConfirm(p => ({ ...p, open:false })); }, [confirm]);

  const snackbar = useCallback((title: string, sub?: string, icon?: string) => {
    const id = Date.now().toString();
    setSnacks(p => [...p, { id, title, sub, icon: icon||'✅' }]);
    setTimeout(() => setSnacks(p => p.filter(s => s.id !== id)), 4000);
  }, []);

  if (isLoading) return (
    <div suppressHydrationWarning style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', fontFamily:"'Cairo',sans-serif",
      background:'linear-gradient(145deg,#e8f5e9 0%,#f0fdf4 40%,#d1fae5 100%)',
      fontSize:'16px', fontWeight:700, color:'#16a34a',
    }}>Loading Calendar…</div>
  );

  return (
    <Ctx.Provider value={{
      curView, setCurView, viewDate, setViewDate,
      events, addEvent, updateEvent, deleteEvent,
      todos, addTodo, toggleTodo, deleteTodo,
      globalEvents, showGlobals, toggleGlobals,
      drawerOpen, setDrawerOpen,
      modal, openModal, closeModal,

      confirmOpen:confirm.open, confirmMsg:confirm.msg, openConfirm, closeConfirm, confirmOk,
      snackbar,
      isLoading,
    }}>
      {children}

      {/* ── Snackbar Zone ── */}
      <div id="snackbar-zone">
        {snacks.map(s => (
          <div key={s.id} className="snackbar">
            <div className="snack-icon-wrap">{s.icon}</div>
            <div className="snack-body">
              <div className="snack-label">Calendar</div>
              <div className="snack-title">{s.title}</div>
              {s.sub && <div className="snack-sub">{s.sub}</div>}
            </div>
            <button className="snack-close" onClick={() => setSnacks(p => p.filter(x => x.id !== s.id))}>✕</button>
            <div className="snack-bar"></div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCalendar must be inside CalendarProvider");
  return ctx;
}

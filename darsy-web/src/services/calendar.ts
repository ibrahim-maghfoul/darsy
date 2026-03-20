import api from '@/lib/api';

export interface CalEvent {
  id: string;
  title: string;
  desc?: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  duration?: number;
  allDay?: boolean;
  category: string;
  color: string;
  reminder?: boolean;
  reminderMins?: number;
  createdAt: string;
  updatedAt?: string;
  isGlobal?: boolean;
}

export interface Todo {
  id: string;
  label: string;
  done: boolean;
  createdAt: string;
  completedAt?: string | null;
  updatedAt?: string;
}

export const calendarService = {
  getCalendar: async (): Promise<{ events: CalEvent[]; todos: Todo[] }> => {
    const res = await api.get('/calendar');
    return res.data;
  },

  syncCalendar: async (events: CalEvent[], todos: Todo[]): Promise<void> => {
    await api.put('/calendar', { events, todos });
  },

  addEvent: async (event: CalEvent): Promise<CalEvent> => {
    const res = await api.post('/calendar/events', event);
    return res.data;
  },

  updateEvent: async (event: CalEvent): Promise<CalEvent> => {
    const res = await api.put(`/calendar/events/${event.id}`, event);
    return res.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await api.delete(`/calendar/events/${id}`);
  },

  addTodo: async (todo: Todo): Promise<Todo> => {
    const res = await api.post('/calendar/todos', todo);
    return res.data;
  },

  toggleTodo: async (id: string): Promise<void> => {
    await api.put(`/calendar/todos/${id}`);
  },

  deleteTodo: async (id: string): Promise<void> => {
    await api.delete(`/calendar/todos/${id}`);
  },

  getGlobalEvents: async (): Promise<CalEvent[]> => {
    const res = await api.get('/calendar/global');
    // Map DB docs to CalEvent shape and ensure isGlobal flag
    return (res.data as any[]).map((e: any) => ({
      id: e.id || e._id,
      title: e.title,
      desc: e.desc,
      date: e.date,
      endDate: e.endDate,
      category: e.category,
      color: e.color,
      isGlobal: true,
      createdAt: e.createdAt || '',
    }));
  },
};

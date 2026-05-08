import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import MainLayout from '@/src/components/layout/MainLayout';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/src/lib/utils';

export default function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">University Calendar</h1>
            <p className="text-gray-500">Official broadcasts, events, and important university dates.</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-gray-400" /></button>
            <h2 className="font-serif text-xl text-primary font-bold min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-gray-400" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-black uppercase tracking-widest text-gray-300 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Padding for first day of month */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square bg-gray-50/50 rounded-2xl" />
              ))}
              
              {days.map((day) => {
                const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
                return (
                  <div 
                    key={day.toISOString()} 
                    className={cn(
                      "aspect-square rounded-2xl border flex flex-col p-2 relative group cursor-pointer transition-all",
                      dayEvents.length > 0 ? "border-primary/20 bg-primary-light/30" : "border-gray-50 hover:bg-gray-50 bg-white"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold",
                      isSameDay(day, new Date()) ? "text-primary bg-primary-light w-6 h-6 flex items-center justify-center rounded-full" : "text-gray-400"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-auto flex flex-wrap gap-1">
                      {dayEvents.map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-black text-gray-300 tracking-widest px-2">Upcoming this month</h3>
            {loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
            ) : events.filter(e => isSameMonth(new Date(e.date), currentDate)).length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100">No events scheduled for this month.</div>
            ) : (
              events
                .filter(e => isSameMonth(new Date(e.date), currentDate))
                .map(event => (
                  <div key={event.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-tighter bg-primary-light px-2 py-0.5 rounded mb-2 inline-block">
                          {event.category || 'General'}
                        </span>
                        <h4 className="font-serif font-bold text-gray-900 group-hover:text-primary transition-colors">{event.title}</h4>
                      </div>
                      <div className="text-right flex-shrink-0">
                         <p className="text-xl font-serif font-bold text-primary leading-none">{format(new Date(event.date), 'dd')}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(event.date), 'MMM')}</p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
                       <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{format(new Date(event.date), 'hh:mm a')}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{event.location || 'LASUED Campus'}</span>
                       </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

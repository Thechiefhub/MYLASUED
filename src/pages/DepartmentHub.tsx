import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import MainLayout from '@/src/components/layout/MainLayout';
import { Users, Calendar, Star, ArrowRight, ShieldCheck, MapPin, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function DepartmentHub() {
  const { deptName } = useParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deptName) return;

    // Fetch Department Groups
    const gq = query(collection(db, 'groups'), where('department', '==', deptName), limit(10));
    const unsubscribeGroups = onSnapshot(gq, (snap) => {
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Top Students in Dept
    const uq = query(collection(db, 'users'), where('department', '==', deptName), orderBy('reputation', 'desc'), limit(5));
    const unsubscribeUsers = onSnapshot(uq, (snap) => {
      setTopStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Dept Events
    const eq = query(collection(db, 'events'), where('category', '==', deptName), orderBy('date', 'asc'), limit(5));
    const unsubscribeEvents = onSnapshot(eq, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setLoading(false);
    return () => {
      unsubscribeGroups();
      unsubscribeUsers();
      unsubscribeEvents();
    };
  }, [deptName]);

  if (loading) return <MainLayout><div className="p-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="relative h-64 bg-primary rounded-3xl overflow-hidden flex flex-col items-center justify-center text-center p-8 text-white shadow-2xl shadow-primary/20">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
           <div className="relative z-10 space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md">Departmental Hub</span>
              <h1 className="text-5xl font-serif font-black">{deptName}</h1>
              <p className="text-white/80 max-w-lg mx-auto font-medium">Connecting professionals, materials, and sessions specifically for {deptName} students.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Groups Column */}
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-serif text-primary flex items-center gap-2">
                    <Users className="w-6 h-6" /> Active Study Groups
                 </h2>
                 <Link to="/groups" className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                    Explore All <ArrowRight className="w-3 h-3" />
                 </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {groups.map(group => (
                    <Link 
                      to={`/group/${group.id}`} 
                      key={group.id}
                      className="bg-white p-5 rounded-3xl border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                    >
                       <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary font-bold text-xl">
                             {group.name[0]}
                          </div>
                          {group.isOfficial && (
                             <ShieldCheck className="w-5 h-5 text-primary" />
                          )}
                       </div>
                       <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{group.name}</h3>
                       <p className="text-xs text-gray-500 mt-2 line-clamp-2">{group.description}</p>
                       <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> 24 Members</span>
                          <span className="flex items-center gap-1 text-accent"><BookOpen className="w-3 h-3" /> 12 Files</span>
                       </div>
                    </Link>
                 ))}
                 {groups.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                       <p className="text-gray-400 italic">No specific groups found for this department yet.</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Sidebar: Top Students & Events */}
           <div className="space-y-12">
              {/* Top Students */}
              <section className="space-y-6">
                 <h2 className="text-2xl font-serif text-primary flex items-center gap-2">
                    <Star className="w-6 h-6" /> Top Performers
                 </h2>
                 <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {topStudents.map((student, i) => (
                       <Link 
                        to={`/profile/${student.username?.replace('@','')}`} 
                        key={student.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                       >
                          <div className="flex items-center gap-4">
                             <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                                   {student.image ? <img src={student.image} className="w-full h-full object-cover rounded-full" /> : student.fullName[0]}
                                </div>
                                <div className="absolute -top-1 -left-1 w-5 h-5 bg-accent text-primary rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm">
                                   {i+1}
                                </div>
                             </div>
                             <div>
                                <p className="text-sm font-bold text-gray-900">{student.fullName}</p>
                                <p className="text-[10px] text-gray-400">Lvl {student.level}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-xs font-black text-primary tabular-nums">{student.reputation || 0}</div>
                             <div className="text-[8px] uppercase tracking-tighter text-gray-300">Reputation</div>
                          </div>
                       </Link>
                    ))}
                 </div>
              </section>

              {/* Department Events */}
              <section className="space-y-6">
                 <h2 className="text-2xl font-serif text-primary flex items-center gap-2">
                    <Calendar className="w-6 h-6" /> Upcoming Dept. Events
                 </h2>
                 <div className="space-y-4">
                    {events.map(event => (
                       <div key={event.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-2 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <h4 className="font-bold text-gray-900 mb-2">{event.title}</h4>
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleDateString()}
                             </div>
                             <div className="flex items-center gap-2 text-xs text-gray-500">
                                <MapPin className="w-3.5 h-3.5" /> {event.location || 'Dept. Hall'}
                             </div>
                          </div>
                       </div>
                    ))}
                    {events.length === 0 && (
                       <p className="text-center py-8 text-gray-400 text-sm italic">No departmental sessions scheduled.</p>
                    )}
                 </div>
              </section>
           </div>
        </div>
      </div>
    </MainLayout>
  );
}

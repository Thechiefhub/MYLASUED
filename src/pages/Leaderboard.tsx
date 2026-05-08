import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import MainLayout from '@/src/components/layout/MainLayout';
import { Trophy, Medal, Star, Filter, Search, Loader2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('All');
  const [search, setSearch] = useState('');

  const departments = [
    "All", "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology", 
    "Educational Management", "Primary Education", "Technical Education"
  ];

  useEffect(() => {
    let q = query(collection(db, 'users'), orderBy('reputation', 'desc'), limit(50));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContributors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filtered = contributors.filter(c => {
    const deptMatch = deptFilter === 'All' || c.department === deptFilter;
    const searchMatch = c.fullName.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase());
    return deptMatch && searchMatch;
  });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex p-3 bg-accent/20 rounded-full text-primary mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-serif text-primary">Top Contributors</h1>
          <p className="text-gray-500 max-w-lg mx-auto">Recognizing professionals who are building the community through knowledge sharing and engagement.</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or username..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {departments.slice(0, 5).map(dept => (
              <button 
                key={dept}
                onClick={() => setDeptFilter(dept)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                  deptFilter === dept ? "bg-primary text-white border-primary shadow-sm shadow-primary/20" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                )}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-24 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-400">Loading leaderboard...</p>
             </div>
          ) : (
            <div className="divide-y divide-gray-50">
               {filtered.map((user, index) => (
                  <Link 
                    to={`/profile/${user.username.replace('@', '')}`}
                    key={user.id} 
                    className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-8 text-center font-black text-gray-200 group-hover:text-primary transition-colors italic text-xl">
                           #{index + 1}
                        </div>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-light flex items-center justify-center text-primary font-bold">
                           {user.image ? <img src={user.image} className="w-full h-full object-cover" /> : user.fullName[0]}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900">{user.fullName}</h4>
                              {index < 3 && (
                                 <Medal className={cn(
                                    "w-4 h-4",
                                    index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"
                                 )} />
                              )}
                           </div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">{user.department} • {user.level}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="flex items-center gap-1.5 text-primary">
                           <Star className="w-4 h-4 fill-primary" />
                           <span className="text-xl font-black tabular-nums">{user.reputation || 0}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Reputation Points</p>
                     </div>
                  </Link>
               ))}
               {filtered.length === 0 && (
                  <div className="p-24 text-center text-gray-400 italic">No professionals matches your criteria.</div>
               )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

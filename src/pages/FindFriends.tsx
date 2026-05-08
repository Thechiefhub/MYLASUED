import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, or, and, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import MainLayout from '../components/layout/MainLayout';
import { Search, UserPlus, Check, UserCheck, Clock, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function FindFriends() {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendships, setFriendships] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch current user's friendships to show status
    const fetchFriendships = async () => {
      const q = query(
        collection(db, 'friendships'),
        or(where('user1', '==', user.uid), where('user2', '==', user.uid)) as any
      );
      const snap = await getDocs(q);
      setFriendships(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchFriendships();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Searching by username or full name
      const q = query(
        collection(db, 'users'),
        or(
          where('username', '>=', searchTerm),
          where('username', '<=', searchTerm + '\uf8ff'),
          where('fullName', '>=', searchTerm),
          where('fullName', '<=', searchTerm + '\uf8ff')
        ) as any
      );
      
      const snap = await getDocs(q);
      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.id !== user?.uid); // Don't show self
      
      setResults(users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addFriend = async (targetUserId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        user1: user.uid,
        user2: targetUserId,
        status: 'PENDING',
        createdAt: serverTimestamp()
      });
      
      // Update local state
      setFriendships([...friendships, { user1: user.uid, user2: targetUserId, status: 'PENDING' }]);
      
      // Notify target user
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        title: '🤝 New Friend Request',
        content: `${profile?.fullName} (@${profile?.username}) wants to be your friend.`,
        type: 'SYSTEM',
        link: `/profile/${profile?.username?.replace('@', '')}`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const acceptFriend = async (targetId: string) => {
     if (!user) return;
     const f = friendships.find(f => (f.user1 === targetId || f.user2 === targetId) && f.status === 'PENDING');
     if (!f || !f.id) return;

     try {
        await updateDoc(doc(db, 'friendships', f.id), { status: 'ACCEPTED' });
        // Update local state
        setFriendships(friendships.map(fr => fr.id === f.id ? { ...fr, status: 'ACCEPTED' } : fr));
        // Notify them
        await addDoc(collection(db, 'notifications'), {
           userId: targetId,
           title: '🎉 Request Accepted',
           content: `${profile?.fullName} accepted your friend request.`,
           type: 'SYSTEM',
           link: `/profile/${profile?.username?.replace('@', '')}`,
           isRead: false,
           createdAt: serverTimestamp()
        });
     } catch (err) {
        console.error(err);
     }
  };

  const getFriendStatus = (targetId: string) => {
    const f = friendships.find(f => f.user1 === targetId || f.user2 === targetId);
    if (!f) return 'NONE';
    if (f.status === 'ACCEPTED') return 'FRIENDS';
    if (f.user1 === user?.uid) return 'SENT';
    return 'RECEIVED';
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col gap-4">
          <h1 className="text-4xl font-serif font-black text-primary">Find Professionals</h1>
          <p className="text-gray-500 font-medium italic">Search for students across all colleges and departments.</p>
        </header>

        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="Search by name or @username..."
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-2xl shadow-xl shadow-primary/5 font-bold text-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all"
          >
            Search
          </button>
        </form>

        <div className="grid gap-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Clock className="animate-spin text-primary w-8 h-8" /></div>
          ) : results.length > 0 ? (
            results.map((u: any) => {
              const status = getFriendStatus(u.id);
              return (
                <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all">
                  <Link to={`/profile/${u.username.replace('@', '')}`} className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary overflow-hidden border-2 border-transparent group-hover:border-primary transition-all">
                      {u.image ? <img src={u.image} className="w-full h-full object-cover" /> : <Users className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-black text-primary text-lg flex items-center gap-2">
                        {u.fullName}
                        {u.isOnline && <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                      </h3>
                      <p className="text-gray-400 font-bold text-sm">{u.username} • {u.college}</p>
                      <p className="text-[10px] uppercase font-black text-primary/60 tracking-widest mt-1">{u.department} • {u.level}</p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    {status === 'NONE' && (
                      <button 
                         onClick={() => addFriend(u.id)}
                         className="flex items-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-xl font-black text-sm hover:bg-primary hover:text-white transition-all uppercase tracking-widest"
                      >
                        <UserPlus className="w-4 h-4" /> Add
                      </button>
                    )}
                    {status === 'SENT' && (
                      <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Pending
                      </div>
                    )}
                    {status === 'FRIENDS' && (
                      <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="w-4 h-4" /> Mutuals
                      </div>
                    )}
                    {status === 'RECEIVED' && (
                       <button 
                          onClick={() => acceptFriend(u.id)}
                          className="bg-accent text-primary px-4 py-2 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-accent/90 transition-all font-serif italic"
                       >
                          Accept
                       </button>
                    )}
                    <Link to={`/profile/${u.username.replace('@', '')}`} className="p-2 text-gray-300 hover:text-primary transition-colors">
                      <ChevronRight />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : searchTerm && !loading && (
            <div className="text-center py-12 text-gray-400 font-medium italic">No professionals found matching "{searchTerm}"</div>
          )}
        </div>

        {/* Suggestion / Friends of Friends logic could go here */}
        <section className="pt-8">
           <h2 className="text-xl font-serif font-black text-primary mb-6 flex items-center gap-3">
             <div className="w-1.5 h-6 bg-accent rounded-full" />
             Recommended Professionals
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* This would ideally be a find-friends-of-friends algorithm */}
              <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 border-dashed text-center">
                 <p className="text-primary font-bold italic mb-2">Grow your network!</p>
                 <p className="text-xs text-gray-500">Add friends to see mutual connections and "friends of friends".</p>
              </div>
           </div>
        </section>
      </div>
    </MainLayout>
  );
}

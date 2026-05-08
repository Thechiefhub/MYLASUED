import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, limit, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import PostComposer from '@/src/components/feed/PostComposer';
import PostCard from '@/src/components/feed/PostCard';
import { Megaphone, AlertCircle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function Feed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagSearch, setTagSearch] = useState('');
  const [showDeptOnly, setShowDeptOnly] = useState(false);

  useEffect(() => {
    // Listen to posts
    let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    
    // In a real app, I'd use index-based search. For now, filter in client for simplicity in prototype.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
      setLoading(false);
    });

    // Fetch broadcasts (simple fetch for now)
    const fetchBroadcasts = async () => {
      const bq = query(collection(db, 'posts'), where('type', '==', 'BROADCAST'), limit(3));
      const bSnap = await getDocs(bq);
      setBroadcasts(bSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchBroadcasts();

    return () => unsubscribe();
  }, []);

  const filteredPostsBySearch = tagSearch.trim() === '' 
    ? posts 
    : posts.filter(p => p.tags?.some((t: string) => t.toLowerCase().includes(tagSearch.toLowerCase())) || p.content.toLowerCase().includes(tagSearch.toLowerCase()));

  const filteredPosts = showDeptOnly && profile?.department
    ? filteredPostsBySearch.filter(p => p.author?.department === profile.department)
    : filteredPostsBySearch;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Filter & Search Bar */}
        <div className="space-y-4 mb-6">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
               type="text" 
               placeholder="Search posts by tags (e.g. #exam, #lasued)..."
               className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
               value={tagSearch}
               onChange={(e) => setTagSearch(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-3 px-1">
              <button 
                onClick={() => setShowDeptOnly(false)}
                className={cn(
                   "px-4 py-1.5 rounded-full text-xs font-bold transition-all tabular-nums",
                   !showDeptOnly ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-100 hover:border-gray-200"
                )}
              >
                 Global Feed
              </button>
              {profile?.department && (
                 <button 
                   onClick={() => setShowDeptOnly(true)}
                   className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                      showDeptOnly ? "bg-primary text-white" : "bg-white text-gray-400 border border-gray-100 hover:border-gray-200"
                   )}
                 >
                    {profile.department} Department
                 </button>
              )}
           </div>
        </div>

        {/* Broadcast Banner */}
        <AnimatePresence>
          {broadcasts.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-primary text-white rounded-xl overflow-hidden relative"
            >
              <div className="p-4 flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-accent text-primary px-2 py-0.5 rounded">Urgent</span>
                    <h3 className="font-bold text-sm">{broadcasts[0].title || "Official Broadcast"}</h3>
                  </div>
                  <p className="text-xs text-white/80 line-clamp-2">{broadcasts[0].content}</p>
                </div>
                <button className="text-xs font-bold bg-white text-primary px-3 py-1.5 rounded-lg hover:bg-primary-light transition-colors">
                  Read More
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PostComposer />

        <div className="space-y-4">
          {loading ? (
            <div className="p-8 text-center text-gray-400 italic">Finding latest updates...</div>
          ) : filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {!loading && filteredPosts.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
               <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <p className="text-gray-400">No posts yet. Be the first to start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

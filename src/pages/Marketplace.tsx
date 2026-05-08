import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot, where, orderBy, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import { Search, ShoppingBag, Plus, Tag, MapPin, Loader2, Star, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [condition, setCondition] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    if (user) {
      const bq = query(collection(db, 'bookmarks'), where('userId', '==', user.uid));
      const unsubscribeBookmarks = onSnapshot(bq, (snap) => {
        setBookmarks(snap.docs.map(d => d.data().itemId));
      });
      return () => {
        unsubscribe();
        unsubscribeBookmarks();
      }
    }

    return () => unsubscribe();
  }, [user]);

  const handleBookmark = async (e: React.MouseEvent, item: any) => {
     e.preventDefault();
     e.stopPropagation();
     if (!user) return;
     
     try {
        const isBookmarked = bookmarks.includes(item.id);
        if (isBookmarked) {
           const q = query(collection(db, 'bookmarks'), where('userId', '==', user.uid), where('itemId', '==', item.id));
           const snap = await getDocs(q);
           snap.forEach(async (d) => await deleteDoc(doc(db, 'bookmarks', d.id)));
        } else {
           await addDoc(collection(db, 'bookmarks'), {
              userId: user.uid,
              itemId: item.id,
              type: 'LISTING',
              createdAt: new Date().toISOString()
           });
        }
     } catch (err) {
        console.error(err);
     }
  };

  const categories = ["All", "Textbooks", "Electronics", "Fashion", "Services", "Food", "Accommodation", "Other"];
  const priceRanges = ["All", "Under ₦5,000", "₦5,000 - ₦20,000", "₦20,000 - ₦50,000", "Above ₦50,000"];
  const conditions = ["All", "New", "Like New", "Used", "Fair"];

  const filteredListings = listings.filter(l => {
    const catMatch = category === 'All' || l.category === category;
    const condMatch = condition === 'All' || l.condition === condition;
    
    let priceMatch = true;
    if (priceRange === "Under ₦5,000") priceMatch = l.price < 5000;
    else if (priceRange === "₦5,000 - ₦20,000") priceMatch = l.price >= 5000 && l.price <= 20000;
    else if (priceRange === "₦20,000 - ₦50,000") priceMatch = l.price > 20000 && l.price <= 50000;
    else if (priceRange === "Above ₦50,000") priceMatch = l.price > 50000;

    return catMatch && condMatch && priceMatch;
  });

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">Campus Marketplace</h1>
            <p className="text-gray-500">Buy and sell items within the LASUED community.</p>
          </div>
          <Link 
            to="/marketplace/create" 
            className="flex items-center gap-2 bg-accent text-primary px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all self-start shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Sell Something
          </Link>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      category === cat ? "bg-primary text-white border-primary" : "bg-white text-gray-500 border-gray-100 hover:border-primary/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="w-full md:w-48 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Price Range</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                {priceRanges.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="w-full md:w-32 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Condition</label>
              <select 
                className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                {conditions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full py-24 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-400">Loading listings...</p>
              </div>
            ) : filteredListings.map((item) => (
              <Link 
                key={item.id}
                to={`/marketplace/${item.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="aspect-square bg-gray-100 relative">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-black text-primary border border-gray-100">
                      ₦{item.price?.toLocaleString()}
                    </div>
                    <button 
                      onClick={(e) => handleBookmark(e, item)}
                      className={cn(
                        "p-2 rounded-lg backdrop-blur border transition-all",
                        bookmarks.includes(item.id) 
                          ? "bg-accent/80 border-accent text-primary shadow-lg shadow-accent/20" 
                          : "bg-white/60 border-white/20 text-gray-500 hover:bg-white"
                      )}
                    >
                       <Bookmark className={cn("w-3.5 h-3.5", bookmarks.includes(item.id) && "fill-current")} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                      {item.category}
                    </span>
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                      {item.condition}
                    </span>
                    <div className="flex items-center gap-0.5 ml-auto text-yellow-500">
                       <Star className="w-2.5 h-2.5 fill-current" />
                       <span className="text-[10px] font-black">{item.seller?.rating || '4.8'}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                  <div className="flex items-center justify-between mt-3">
                     <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{item.location || 'On campus'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{item.seller?.username}</span>
                  </div>
                </div>
              </Link>
            ))}

            {!loading && filteredListings.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <Tag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No items found with these filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

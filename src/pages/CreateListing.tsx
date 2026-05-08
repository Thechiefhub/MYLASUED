import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import { ChevronLeft, Camera, ShoppingBag, Loader2, DollarSign } from 'lucide-react';

const CATEGORIES = ["Textbooks", "Electronics", "Fashion", "Services", "Food", "Accommodation", "Other"];
const CONDITIONS = ["New", "Like New", "Used", "Fair"];

export default function CreateListing() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Textbooks',
    condition: 'Used',
    location: 'On Campus',
    isNegotiable: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'listings'), {
        ...formData,
        price: parseFloat(formData.price),
        sellerId: user.uid,
        seller: {
          fullName: profile?.fullName,
          username: profile?.username,
        },
        status: 'ACTIVE',
        createdAt: serverTimestamp(),
      });
      navigate('/marketplace');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-serif text-primary">Sell Something</h1>
            <p className="text-gray-500">List an item for the LASUED community.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-100 hover:bg-gray-100 transition-all cursor-pointer">
                <Camera className="w-6 h-6" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1">Item Title</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Calculus Textbook, iPhone 12"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1">Description</label>
              <textarea 
                required
                placeholder="Tell us about the item's condition, features, etc."
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1">Price (₦)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                  <input 
                    required
                    type="number" 
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                 <label className="flex items-center gap-2 cursor-pointer py-3">
                   <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-200 text-primary focus:ring-primary"
                    checked={formData.isNegotiable}
                    onChange={(e) => setFormData({...formData, isNegotiable: e.target.checked})}
                   />
                   <span className="text-sm font-bold text-gray-600">Price is negotiable</span>
                 </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1">Category</label>
                <select 
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-600"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1">Condition</label>
                <select 
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-gray-600"
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                >
                  {CONDITIONS.map(con => <option key={con} value={con}>{con}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-accent text-primary py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
              <>
                <ShoppingBag className="w-5 h-5" />
                Publish Listing
              </>
            )}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import { cn } from '@/src/lib/utils';
import MainLayout from '@/src/components/layout/MainLayout';
import { ChevronLeft, Camera, Users, Loader2 } from 'lucide-react';

const CATEGORIES = ["Business Forum", "Motivational", "Amebo Gist", "Brainstorming", "Department Connect", "Course Study", "Other"];

export default function CreateGroup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Brainstorming',
    isPrivate: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'groups'), {
        ...formData,
        creatorId: user.uid,
        memberCount: 1,
        isOfficial: false,
        createdAt: serverTimestamp(),
      });
      navigate(`/groups/${docRef.id}`);
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
            <h1 className="text-3xl font-serif text-primary">New Group</h1>
            <p className="text-gray-500">Create a space for your community.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="group relative w-full h-32 bg-primary-light rounded-2xl flex flex-col items-center justify-center text-primary/40 border-2 border-dashed border-primary/20 hover:bg-primary-light/80 transition-all cursor-pointer overflow-hidden">
             <Camera className="w-8 h-8 mb-2" />
             <span className="text-xs font-bold uppercase tracking-wider">Upload Cover</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1 shadow-sm-text">Group Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. MAT 301 Study Hub"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-1">Description</label>
              <textarea 
                required
                placeholder="What is this group about?"
                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
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
              <div className="flex flex-col">
                <label className="block text-xs uppercase font-black text-gray-400 tracking-widest mb-3">Privacy</label>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, isPrivate: false})}
                    className={cn("flex-1 py-3 rounded-lg text-xs font-bold transition-all", !formData.isPrivate ? "bg-white text-primary shadow-sm" : "text-gray-400")}
                   >
                    Public
                   </button>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, isPrivate: true})}
                    className={cn("flex-1 py-3 rounded-lg text-xs font-bold transition-all", formData.isPrivate ? "bg-white text-primary shadow-sm" : "text-gray-400")}
                   >
                    Private
                   </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-dark transition-all disabled:opacity-50 mt-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
              <>
                <Users className="w-5 h-5" />
                Create Group
              </>
            )}
          </button>
        </form>
      </div>
    </MainLayout>
  );
}

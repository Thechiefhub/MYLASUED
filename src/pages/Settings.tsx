import { useState, useEffect } from 'react';
import { useAuth } from '@/src/lib/authContext';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import MainLayout from '@/src/components/layout/MainLayout';
import { User, Shield, Bell, MessageSquare, Send, Loader2, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Settings() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');
  const [feedbackType, setFeedbackType] = useState('SUGGESTION');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileData, setProfileData] = useState({
     fullName: '',
     bio: '',
     image: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        image: profile.image || ''
      });
    }
  }, [profile]);

  const handleFeedbackSubmit = async () => {
     if (!user || !feedbackContent.trim()) return;
     setLoading(true);
     try {
        await addDoc(collection(db, 'feedback'), {
           userId: user.uid,
           userEmail: user.email,
           type: feedbackType,
           content: feedbackContent,
           createdAt: serverTimestamp(),
           status: 'NEW'
        });
        setSuccess(true);
        setFeedbackContent('');
        setTimeout(() => setSuccess(false), 5000);
     } catch (err) {
        console.error(err);
     } finally {
        setLoading(false);
     }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
       await updateDoc(doc(db, 'users', user.uid), {
          ...profileData,
          updatedAt: serverTimestamp()
       });
       setSuccess(true);
       setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
 };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 py-8 px-4">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
           <h1 className="text-3xl font-serif font-black text-primary px-4 mb-8">Portal</h1>
           {[
              { id: 'Profile', icon: User },
              { id: 'Account', icon: Shield },
              { id: 'Notifications', icon: Bell },
              { id: 'Feedback', icon: MessageSquare },
           ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                   "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black transition-all uppercase tracking-widest",
                   activeTab === tab.id ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                 <tab.icon className="w-4 h-4" />
                 {tab.id}
              </button>
           ))}
        </div>

        {/* Content */}
        <div className="flex-1">
           {activeTab === 'Profile' && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-black text-primary">Personal Profile</h2>
                    {success && (
                       <div className="bg-green-50 text-green-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-green-100 italic">
                          <CheckCircle className="w-3 h-3" /> Saved!
                       </div>
                    )}
                 </div>

                 <div className="flex flex-col items-center pb-8 border-b border-gray-50">
                    <div className="relative group">
                       <div className="w-32 h-32 rounded-3xl bg-primary-light flex items-center justify-center text-primary text-5xl font-black overflow-hidden border-8 border-white shadow-2xl transition-transform group-hover:scale-105">
                          {profileData.image ? <img src={profileData.image} className="w-full h-full object-cover" /> : profileData.fullName?.[0]}
                       </div>
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl cursor-pointer">
                          <ImageIcon className="text-white w-8 h-8" />
                       </div>
                    </div>
                    <div className="mt-6 w-full max-w-sm">
                       <label className="text-[10px] font-black uppercase text-gray-400 block mb-2 text-center tracking-widest">Profile Picture URL</label>
                       <input 
                          type="text" 
                          placeholder="Paste a link to your image..."
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                          value={profileData.image}
                          onChange={(e) => setProfileData({...profileData, image: e.target.value})}
                       />
                       <p className="text-[10px] text-gray-400 mt-2 text-center italic font-medium">Add a photo so peers can recognize you professionally.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Full Professional Name</label>
                       <input 
                         type="text" 
                         className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none" 
                         value={profileData.fullName}
                         onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">System Username</label>
                       <div className="w-full bg-gray-100 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 flex items-center gap-2 italic">
                          {profile?.username}
                          <span className="text-[8px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-black uppercase">Immutable</span>
                       </div>
                    </div>
                    <div className="col-span-full space-y-3">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Professional Bio / Intro</label>
                       <textarea 
                          rows={4}
                          placeholder="Tell your colleagues about your goals and interests..."
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
                          value={profileData.bio}
                          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="pt-6">
                    <button 
                       onClick={handleSaveProfile}
                       disabled={loading}
                       className="w-full md:w-auto bg-primary text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-dark transition-all disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                       {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                       Commit Changes
                    </button>
                 </div>
              </div>
           )}

           {activeTab === 'Feedback' && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div>
                    <h2 className="text-2xl font-serif font-black text-primary mb-3">Feedback Terminal</h2>
                    <p className="text-gray-500 font-medium italic">Your direct line to the professional development team.</p>
                 </div>

                 {success && (
                    <div className="bg-green-50 text-green-700 p-6 rounded-3xl flex items-center gap-4 border border-green-100 animate-in fade-in">
                       <CheckCircle className="w-6 h-6" />
                       <span className="text-sm font-black uppercase tracking-widest leading-relaxed">System message: Feedback acknowledged and stored. Thank you.</span>
                    </div>
                 )}

                 <div className="space-y-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Transmission Category</label>
                       <div className="flex flex-wrap gap-3">
                          {['BUG', 'SUGGESTION', 'OTHER'].map(type => (
                             <button
                                key={type}
                                onClick={() => setFeedbackType(type)}
                                className={cn(
                                  "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all shadow-sm",
                                  feedbackType === type ? "bg-primary border-primary text-white scale-105" : "bg-white border-gray-100 text-gray-400 hover:border-primary/20"
                                )}
                             >
                                {type}
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Detailed Content</label>
                       <textarea 
                          placeholder="Establish clear communication for our development team..."
                          rows={6}
                          className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-6 text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
                          value={feedbackContent}
                          onChange={(e) => setFeedbackContent(e.target.value)}
                       />
                    </div>

                    <div className="pt-4">
                       <button 
                         disabled={loading || !feedbackContent.trim()}
                         onClick={handleFeedbackSubmit}
                         className="w-full md:w-auto bg-primary text-white px-12 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-primary/20"
                       >
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                          Transmit Feedback
                       </button>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'Account' && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center">
                    <Shield className="w-10 h-10 text-primary opacity-20" />
                 </div>
                 <h3 className="text-2xl font-serif font-black text-primary italic">Security Terminal Locked</h3>
                 <p className="text-gray-400 font-bold italic text-sm max-w-sm">Level 2 authentication protocols are currently undergoing optimization. Secure account management will resume shortly.</p>
              </div>
           )}

           {activeTab === 'Notifications' && (
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center">
                    <Bell className="w-10 h-10 text-primary opacity-20" />
                 </div>
                 <h3 className="text-2xl font-serif font-black text-primary italic">Alert Protocols</h3>
                 <p className="text-gray-400 font-bold italic text-sm max-w-sm">Granular notification controls are arriving in v2.4. Currently, all professional alerts are enabled by default.</p>
              </div>
           )}
        </div>
      </div>
    </MainLayout>
  );
}

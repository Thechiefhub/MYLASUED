import React, { useState, useRef } from 'react';
import { Image, Send, BarChart2, Globe, Users, Loader2, Hash, Calendar } from 'lucide-react';
import { useAuth } from '@/src/lib/authContext';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';

interface PostComposerProps {
  groupId?: string;
}

export default function PostComposer({ groupId }: PostComposerProps) {
  const { profile, user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addPollOption = () => setPollOptions([...pollOptions, '']);
  const removePollOption = (index: number) => setPollOptions(pollOptions.filter((_, i) => i !== index));
  const updatePollOption = (index: number, val: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = val;
    setPollOptions(newOptions);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
       e.preventDefault();
       const tag = tagInput.trim().replace(/^#/, '');
       if (!tags.includes(tag)) setTags([...tags, tag]);
       setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

  const handlePost = async () => {
    if (!content.trim() || !user) return;

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        content,
        authorId: user.uid,
        groupId: groupId || null,
        author: {
          fullName: profile?.fullName,
          username: profile?.username,
          image: profile?.image || null,
          department: profile?.department || null,
          isOnline: profile?.isOnline || true
        },
        type: groupId ? 'BROADCAST' : 'POST',
        media: mediaUrl ? [mediaUrl] : [],
        tags: tags,
        poll: showPoll ? {
          options: pollOptions.filter(o => o.trim() !== '').map(text => ({ text, votes: 0 })),
          voters: []
        } : null,
        scheduledAt: scheduledDate || null,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0
      });

      // Handle Tagging (@mentions)
      const mentions = content.match(/@(\w+)/g);
      if (mentions) {
         mentions.forEach(async (mention) => {
            const username = mention; // e.g. @username
            try {
               const uq = query(collection(db, 'users'), where('username', '==', username));
               const uSnap = await getDocs(uq);
               if (!uSnap.empty) {
                  const targetUserId = uSnap.docs[0].id;
                  if (targetUserId !== user.uid) {
                     await addDoc(collection(db, 'notifications'), {
                        userId: targetUserId,
                        title: '👋 New Mention',
                        content: `${profile?.username} mentioned you in a post.`,
                        type: 'MENTION',
                        link: `/feed?post=${docRef.id}`,
                        isRead: false,
                        createdAt: serverTimestamp()
                     });
                  }
               }
            } catch (err) {
               console.error(err);
            }
         });
      }

      setContent('');
      setTags([]);
      setScheduledDate('');
      setShowSchedule(false);
      setMediaUrl('');
      setShowMediaInput(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ring-1 ring-gray-100 transition-all hover:ring-primary/10">
      <div className="flex gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary border-2 border-white shadow-sm overflow-hidden">
            {profile?.image ? <img src={profile.image} className="w-full h-full object-cover" /> : profile?.fullName?.[0]}
          </div>
          <div className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            placeholder={`Professional thoughts, ${profile?.fullName?.split(' ')[0] || 'User'}?`}
            className="w-full border-none focus:ring-0 p-0 text-lg placeholder:text-gray-400 resize-none min-h-[100px] font-medium text-gray-800"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {showMediaInput && (
             <div className="mb-4 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Paste image URL here..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary/20 transition-all"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                />
                {mediaUrl && (
                  <div className="mt-2 relative group w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img src={mediaUrl} className="w-full h-full object-cover" />
                    <button onClick={() => setMediaUrl('')} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-black">Change</span>
                    </button>
                  </div>
                )}
             </div>
          )}

          {tags.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(t => (
                   <span key={t} className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-lg border border-primary/10 uppercase tracking-tighter">
                      #{t}
                      <button onClick={() => removeTag(t)} className="hover:text-danger ml-1 opacity-50 hover:opacity-100">×</button>
                   </span>
                ))}
             </div>
          )}

          {showSchedule && (
             <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <Calendar className="w-4 h-4 text-primary" />
                <input 
                  type="datetime-local" 
                  className="bg-transparent border-none text-xs font-black text-primary focus:ring-0"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
             </div>
          )}
          
          {showPoll && (
             <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 animate-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black uppercase text-gray-400">Professional Inquiry (Poll)</p>
                   <button onClick={() => setShowPoll(false)} className="text-gray-300 hover:text-danger">×</button>
                </div>
                {pollOptions.map((opt, i) => (
                   <div key={i} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={`Option ${i+1}`}
                        className="flex-1 bg-white border border-gray-100 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:border-primary/20"
                        value={opt}
                        onChange={(e) => updatePollOption(i, e.target.value)}
                      />
                      {pollOptions.length > 2 && (
                         <button onClick={() => removePollOption(i)} className="text-gray-300 hover:text-danger">×</button>
                      )}
                   </div>
                ))}
                {pollOptions.length < 5 && (
                   <button 
                    onClick={addPollOption}
                    className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-primary/10 transition-all mt-2"
                   >
                      + Add Option
                   </button>
                )}
             </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-2">
            <div className="flex gap-1">
              <button 
                onClick={() => setShowPoll(!showPoll)}
                className={cn("p-2 hover:bg-primary/5 rounded-lg text-gray-400 transition-colors", showPoll && "text-primary bg-primary/5")}
                title="Poll"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowMediaInput(!showMediaInput)}
                className={cn("p-2 hover:bg-primary/5 rounded-lg text-gray-400 transition-colors", showMediaInput && "text-primary bg-primary/5")}
                title="Attach Media"
              >
                <Image className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSchedule(!showSchedule)}
                className={cn("p-2 hover:bg-primary/5 rounded-lg text-gray-400 transition-colors", showSchedule && "text-primary bg-primary/5")}
                title="Schedule Post"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <div className="relative flex items-center ml-2">
                 <Hash className="absolute left-3 w-3.5 h-3.5 text-gray-300" />
                 <input 
                  type="text" 
                  placeholder="Tags..."
                  className="pl-8 pr-3 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-bold placeholder:text-gray-300 focus:bg-white focus:border-primary/20 outline-none w-20 focus:w-36 transition-all"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                 />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                disabled={(!content.trim() && !mediaUrl) || loading}
                onClick={handlePost}
                className="bg-primary text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all disabled:opacity-30 flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 fill-current" />}
                {scheduledDate ? 'Schedule' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

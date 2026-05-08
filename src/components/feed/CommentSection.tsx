import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setInitialLoading(false);
    });
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        content: newComment,
        authorId: user.uid,
        authorName: profile?.fullName,
        authorUsername: profile?.username,
        authorImage: profile?.image || null,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (comment: any) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim() || loading) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
        content: editContent,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 space-y-6">
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-black text-[10px] overflow-hidden border border-primary/10">
           {profile?.image ? <img src={profile.image} className="w-full h-full object-cover" /> : profile?.fullName?.[0]}
        </div>
        <div className="flex-1 relative group">
          <input 
            type="text" 
            placeholder="Write a comment..."
            className="w-full pl-4 pr-12 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:bg-primary/5 rounded-lg disabled:opacity-30 transition-all"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
        {initialLoading ? (
           <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-gray-300" /></div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-[10px] overflow-hidden border border-gray-100 flex-shrink-0">
                {comment.authorImage ? <img src={comment.authorImage} className="w-full h-full object-cover" /> : comment.authorName?.[0]}
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 px-4 py-2 rounded-2xl rounded-tl-none group-hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-black text-primary">{comment.authorName}</span>
                    <span className="text-[9px] text-gray-400 font-medium">@{comment.authorUsername}</span>
                    {comment.authorId === user?.uid && editingId !== comment.id && (
                      <button 
                        onClick={() => startEditing(comment)}
                        className="ml-auto opacity-0 group-hover:opacity-100 text-[9px] font-black uppercase text-primary/40 hover:text-primary transition-all"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingId === comment.id ? (
                    <div className="mt-1 space-y-2">
                      <textarea 
                        className="w-full bg-white border border-primary/10 rounded-xl px-3 py-2 text-[11px] font-medium focus:ring-2 focus:ring-primary/5 outline-none resize-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 pb-1">
                        <button onClick={cancelEditing} className="text-[9px] font-black uppercase text-gray-400 hover:text-gray-600 transition-all">Cancel</button>
                        <button 
                          onClick={() => handleUpdate(comment.id)} 
                          disabled={!editContent.trim() || loading}
                          className="text-[9px] font-black uppercase text-primary hover:text-primary-dark transition-all disabled:opacity-30"
                        >
                          {loading ? 'Saving...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                      {comment.content}
                      {comment.updatedAt && <span className="text-[8px] text-gray-400 ml-1 opacity-60">(edited)</span>}
                    </p>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 font-bold mt-1 px-1">
                   {comment.createdAt?.seconds ? formatDistanceToNow(comment.createdAt.seconds * 1000) + ' ago' : 'Just now'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-300">
             <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
             <p className="text-[10px] uppercase font-black tracking-widest italic">Be the first to professionalize this post</p>
          </div>
        )}
      </div>
    </div>
  );
}

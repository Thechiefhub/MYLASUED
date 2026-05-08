import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Flag, Hash, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/authContext';
import { Link } from 'react-router-dom';
import CommentSection from './CommentSection';

interface PostProps {
  post: any;
  key?: any;
}

export default function PostCard({ post }: PostProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const isBroadcast = post.type === 'BROADCAST' || post.type === 'ANNOUNCEMENT';

  const handleLike = async () => {
    if (!user || liked) return;
    setLiked(true);
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        likesCount: increment(1)
      });
      await updateDoc(doc(db, 'users', post.authorId), {
        reputation: increment(1)
      });
    } catch (err) {
      console.error(err);
      setLiked(false);
    }
  };

  const handleBookmark = async () => {
     if (!user) return;
     if (bookmarked) {
        setBookmarked(false);
        // Find and delete bookmark
        const q = query(collection(db, 'bookmarks'), where('userId', '==', user.uid), where('itemId', '==', post.id));
        const snap = await getDocs(q);
        snap.forEach(async (d) => await deleteDoc(doc(db, 'bookmarks', d.id)));
     } else {
        setBookmarked(true);
        await addDoc(collection(db, 'bookmarks'), {
           userId: user.uid,
           itemId: post.id,
           type: 'POST',
           createdAt: new Date().toISOString()
        });
     }
  };

  const handleReport = async () => {
     if (!user) return;
     const reason = window.prompt("Reason for reporting this content?");
     if (!reason) return;
     try {
        await addDoc(collection(db, 'reports'), {
           reporterId: user.uid,
           targetId: post.id,
           type: 'POST',
           reason,
           status: 'PENDING',
           createdAt: serverTimestamp()
        });
        alert("Report submitted to moderation team.");
     } catch (err) {
        console.error(err);
     }
  };

  const handleVote = async (optionIndex: number) => {
     if (!user || !post.poll || post.poll.voters?.includes(user.uid)) return;
     
     const newOptions = [...post.poll.options];
     newOptions[optionIndex].votes += 1;
     
     try {
        await updateDoc(doc(db, 'posts', post.id), {
           'poll.options': newOptions,
           'poll.voters': [...(post.poll.voters || []), user.uid]
        });
     } catch (err) {
        console.error(err);
     }
  };

  const totalVotes = post.poll?.options?.reduce((acc: number, opt: any) => acc + opt.votes, 0) || 0;
  const hasVoted = post.poll?.voters?.includes(user?.uid);

  return (
    <div className={cn(
      "bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:border-gray-200 group relative",
      isBroadcast && "border-l-4 border-l-primary"
    )}>
      {post.scheduledAt && (
         <div className="absolute top-4 right-14 flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded text-primary text-[10px] font-bold">
            <Calendar className="w-3 h-3" />
            Scheduled
         </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm overflow-hidden border border-gray-100">
              {post.author?.image ? (
                <img src={post.author.image} className="w-full h-full object-cover" />
              ) : (
                post.author?.fullName?.[0] || 'U'
              )}
            </div>
            {post.author?.isOnline && (
              <div className="absolute -right-0.5 -bottom-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" title="Online" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.author?.username?.replace('@', '')}`} className="font-bold text-gray-900 leading-none hover:text-primary transition-colors">
                {post.author?.fullName}
              </Link>
              {isBroadcast && (
                <span className="text-[9px] bg-primary-light text-primary font-black uppercase px-2 py-0.5 rounded tracking-tighter">Official</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              <Link to={`/profile/${post.author?.username?.replace('@', '')}`} className="hover:underline">
                {post.author?.username}
              </Link> 
              • {post.createdAt?.seconds ? formatDistanceToNow(post.createdAt.seconds * 1000) + ' ago' : 'Just now'}
            </p>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
             <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-10 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1">
                <button onClick={handleReport} className="w-full px-4 py-2 text-left text-xs font-bold text-danger hover:bg-danger/5 flex items-center gap-2">
                   <Flag className="w-3.5 h-3.5" />
                   Report Content
                </button>
             </div>
          )}
        </div>
      </div>

      <div className="mb-4 px-1">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        
        {post.poll && (
           <div className="mt-4 space-y-2">
              {post.poll.options.map((opt: any, i: number) => {
                 const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                 return (
                    <button 
                      key={i}
                      disabled={hasVoted}
                      onClick={() => handleVote(i)}
                      className={cn(
                        "w-full relative h-10 rounded-xl border border-gray-100 overflow-hidden group/opt transition-all",
                        hasVoted ? "cursor-default" : "hover:border-primary/20"
                      )}
                    >
                       <div 
                         className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500" 
                         style={{ width: `${percentage}%` }}
                       />
                       <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold">
                          <span className={cn(hasVoted ? "text-gray-900" : "text-gray-600")}>{opt.text}</span>
                          {hasVoted && <span className="text-primary">{percentage}%</span>}
                       </div>
                    </button>
                 );
              })}
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 px-1 pt-1">
                 <span>{totalVotes} votes</span>
                 {hasVoted && <span className="text-primary">Voted</span>}
              </div>
           </div>
        )}

        {post.tags && post.tags.length > 0 && (
           <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag: string) => (
                 <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-lg border border-primary/10 uppercase tracking-tighter">
                    <Hash className="w-3 h-3 opacity-30" />
                    {tag}
                 </div>
              ))}
           </div>
        )}
      </div>

      {post.media && post.media.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
          <img src={post.media[0]} alt="Post media" className="w-full h-auto max-h-[500px] object-cover" />
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors group/btn",
              liked ? "text-danger" : "text-gray-400 hover:text-danger"
            )}
          >
            <Heart className={cn("w-5 h-5", liked ? "fill-danger" : "group-hover/btn:fill-danger/10")} />
            <span className="text-xs font-black">{post.likesCount || 0}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "flex items-center gap-1.5 transition-colors group/btn",
              showComments ? "text-primary" : "text-gray-400 hover:text-primary"
            )}
          >
            <MessageCircle className={cn("w-5 h-5", showComments && "fill-primary/10")} />
            <span className="text-xs font-black">{post.commentsCount || 0}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBookmark}
            className={cn(
              "transition-all p-1.5 rounded-lg",
              bookmarked ? "text-accent bg-accent/10" : "text-gray-400 hover:bg-gray-100"
            )}
          >
            <Bookmark className={cn("w-5 h-5", bookmarked && "fill-accent")} />
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/feed?post=${post.id}`);
              alert("Link copied to clipboard!");
              console.log("Shared to platform: Clipboard");
            }}
            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </div>
  );
}

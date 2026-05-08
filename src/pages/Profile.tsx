import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, orderBy, updateDoc, addDoc, serverTimestamp, or, and, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import MainLayout from '@/src/components/layout/MainLayout';
import PostCard from '@/src/components/feed/PostCard';
import { User, MapPin, Calendar, BookOpen, MessageCircle, Settings, Camera, Grid, List, Info, Zap, FileText, ShoppingBag, UserPlus, UserCheck, Clock, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/src/lib/authContext';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function Profile() {
  const navigate = useNavigate();
  const { username: urlUsername } = useParams();
  const { profile: myProfile, user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendship, setFriendship] = useState<any>(null);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Posts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no username in URL, show current user profile
    const targetUsername = urlUsername ? (urlUsername.startsWith('@') ? urlUsername : `@${urlUsername}`) : myProfile?.username;
    
    if (!targetUsername) return;

    const fetchProfile = async () => {
      const q = query(collection(db, 'users'), where('username', '==', targetUsername));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const pData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setProfile(pData);

        // Listen to their posts
        const pq = query(collection(db, 'posts'), where('authorId', '==', pData.id), orderBy('createdAt', 'desc'));
        onSnapshot(pq, (pSnap) => {
          setPosts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Listen to friendship status
        if (currentUser && currentUser.uid !== pData.id) {
           const fq = query(
              collection(db, 'friendships'),
              or(
                 and(where('user1', '==', currentUser.uid), where('user2', '==', pData.id)),
                 and(where('user1', '==', pData.id), where('user2', '==', currentUser.uid))
              ) as any
           );
           onSnapshot(fq, (fSnap) => {
              if (!fSnap.empty) setFriendship({ id: fSnap.docs[0].id, ...fSnap.docs[0].data() });
              else setFriendship(null);
           });
        }

        // Listen to friends if visible
        if ((pData as any).friendListVisible !== false || currentUser?.uid === pData.id) {
           const friendsQuery = query(
              collection(db, 'friendships'),
              where('status', '==', 'ACCEPTED'),
              or(where('user1', '==', pData.id), where('user2', '==', pData.id)) as any
           );
           onSnapshot(friendsQuery, async (fSnap) => {
              const friendIds = fSnap.docs.map(d => {
                 const data = d.data();
                 return data.user1 === pData.id ? data.user2 : data.user1;
              });
              
              if (friendIds.length > 0) {
                 const usersSnap = await getDocs(query(collection(db, 'users'), where('__name__', 'in', friendIds.slice(0, 10))));
                 setFriends(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
              } else {
                 setFriends([]);
              }
           });
        }

        // If own profile, listen to saved items
        if (currentUser?.uid === pData.id) {
           const sq = query(collection(db, 'bookmarks'), where('userId', '==', pData.id));
           onSnapshot(sq, (sSnap) => {
             setSavedItems(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
           });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [urlUsername, myProfile, currentUser]);

  const handleAddFriend = async () => {
    if (!currentUser || !profile) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        user1: currentUser.uid,
        user2: profile.id,
        status: 'PENDING',
        createdAt: serverTimestamp()
      });
      // Notify them
      await addDoc(collection(db, 'notifications'), {
        userId: profile.id,
        title: '🤝 Friend Request',
        content: `${myProfile?.fullName} (@${myProfile?.username}) sent you a friend request.`,
        type: 'SYSTEM',
        link: `/profile/${myProfile?.username?.replace('@', '')}`,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptFriend = async () => {
     if (!friendship) return;
     try {
        await updateDoc(doc(db, 'friendships', friendship.id), { status: 'ACCEPTED' });
        // Notify them
        await addDoc(collection(db, 'notifications'), {
           userId: friendship.user1,
           title: '🎉 Request Accepted',
           content: `${myProfile?.fullName} accepted your friend request.`,
           type: 'SYSTEM',
           link: `/profile/${profile.username.replace('@', '')}`,
           isRead: false,
           createdAt: serverTimestamp()
        });
     } catch (err) {
        console.error(err);
     }
  };

  const toggleStudyPartner = async () => {
    if (!profile || !isOwnProfile) return;
    const newVal = !profile.isLookingForStudyPartner;
    try {
      await updateDoc(doc(db, 'users', profile.id), {
        isLookingForStudyPartner: newVal
      });
      setProfile({ ...profile, isLookingForStudyPartner: newVal });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartMessage = () => {
    if (profile) {
      navigate(`/messages?recipient=${profile.id}`);
    }
  };

  if (loading) return <MainLayout><div className="p-24 text-center font-serif italic text-primary animate-pulse">Establishing secure connection to profile...</div></MainLayout>;
  if (!profile) return <MainLayout><div className="p-24 text-center text-gray-500 font-bold italic underline">Professional terminal not found</div></MainLayout>;

  const isOwnProfile = currentUser?.uid === profile.id;
  const isFriends = friendship?.status === 'ACCEPTED';
  const isPendingSent = friendship?.status === 'PENDING' && friendship.user1 === currentUser?.uid;
  const isPendingReceived = friendship?.status === 'PENDING' && friendship.user2 === currentUser?.uid;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden border-none shadow-2xl shadow-primary/5 transition-all hover:shadow-primary/10 group">
          <div className="h-56 md:h-72 bg-primary relative">
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
             <div className="absolute top-6 right-6 flex gap-3">
                <div className="bg-white/95 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3 scale-anim">
                   <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse shadow-sm shadow-accent" />
                   <span className="text-[10px] font-black text-primary tracking-[0.15em] uppercase whitespace-nowrap">Professional Rep: {profile.reputation || 0}</span>
                </div>
             </div>
             {isOwnProfile && (
               <Link to="/settings" className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-xl text-white p-3 rounded-2xl hover:bg-white/40 transition-all border border-white/10 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100">
                 <Camera className="w-6 h-6" />
               </Link>
             )}
          </div>
          <div className="p-6 md:p-12 -mt-24 md:-mt-32 relative flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
              <div className="relative">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] bg-white p-2 shadow-2xl overflow-hidden ring-4 ring-white transition-transform group-hover:scale-[1.02]">
                   <div className="w-full h-full bg-primary-light flex items-center justify-center text-primary overflow-hidden rounded-[2rem]">
                    {profile.image ? <img src={profile.image} className="w-full h-full object-cover" /> : <User className="w-20 h-20 md:w-28 md:h-28" />}
                   </div>
                </div>
                {profile.isOnline && (
                   <div className="absolute right-4 bottom-4 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg animate-bounce" title="Online now" />
                )}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-4 mb-2">
                   <h1 className="text-4xl md:text-5xl font-serif font-black text-gray-900 tracking-tighter">{profile.fullName}</h1>
                   {isFriends && <ShieldCheck className="w-6 h-6 text-accent fill-accent/10" />}
                </div>
                <p className="text-primary font-black text-xl italic tracking-tight mb-4 flex items-center gap-2">
                  {profile.username}
                  <span className="inline-block w-1.5 h-1.5 bg-gray-300 rounded-full" />
                  <span className="text-xs uppercase tracking-widest text-gray-400 not-italic">{profile.level} Professional</span>
                </p>
                <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{profile.college}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary" />
                    <Link to={`/department/${profile.department}`} className="hover:text-primary transition-colors hover:underline">
                       {profile.department}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>Est {formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {isOwnProfile ? (
                 <Link to="/settings" className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all flex items-center gap-3 shadow-xl shadow-primary/20 scale-anim">
                  <Settings className="w-4 h-4" />
                  Configure
                </Link>
              ) : (
                <>
                  {isFriends ? (
                     <div className="bg-green-50 text-green-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 border border-green-100 italic">
                        <UserCheck className="w-4 h-4" />
                        Mutual Connection
                     </div>
                  ) : isPendingSent ? (
                     <div className="bg-gray-50 text-gray-400 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 italic">
                        <Clock className="w-4 h-4" />
                        Transmission Pending
                     </div>
                  ) : isPendingReceived ? (
                      <button 
                        onClick={handleAcceptFriend}
                        className="bg-accent text-primary px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-accent/90 transition-all flex items-center gap-3 shadow-xl shadow-accent/20"
                      >
                         <UserPlus className="w-4 h-4" />
                         Accept Invite
                      </button>
                  ) : (
                      <button 
                        onClick={handleAddFriend}
                        className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-dark transition-all flex items-center gap-3 shadow-xl shadow-primary/20"
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Connection
                      </button>
                  )}
                  <button 
                    onClick={handleStartMessage}
                    className="p-4 bg-primary-light text-primary hover:bg-primary hover:text-white rounded-2xl transition-all border border-transparent shadow-sm"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-12 flex gap-2 border-t border-gray-50">
            {['Posts', 'Friends', 'Marketplace', 'Communities', 'Resources', 'About'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-5 text-[10px] font-black uppercase tracking-[0.25em] border-b-4 transition-all",
                  activeTab === tab ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-primary/60"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Study Partner Toggle (Only if Own Profile) */}
        {isOwnProfile && (
           <div className="max-w-4xl mx-auto bg-primary/5 p-6 rounded-[2rem] flex items-center justify-between border border-primary/10 shadow-inner group cursor-pointer hover:bg-primary/10 transition-all" onClick={toggleStudyPartner}>
              <div className="flex items-center gap-5">
                 <div className="p-3 bg-white rounded-2xl text-primary shadow-sm group-hover:scale-110 transition-transform"><BookOpen className="w-6 h-6" /></div>
                 <div>
                    <p className="font-black text-gray-900 text-sm uppercase tracking-widest">Active Collaboration Status</p>
                    <p className="text-xs text-primary/60 font-bold italic">Enable academic visibility to attract potential study partners.</p>
                 </div>
              </div>
              <button 
                className={cn(
                  "w-16 h-8 rounded-full relative transition-all shadow-inner",
                  profile.isLookingForStudyPartner ? "bg-accent" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg flex items-center justify-center",
                  profile.isLookingForStudyPartner ? "left-9" : "left-1"
                )}>
                   <Zap className={cn("w-3 h-3 transition-colors", profile.isLookingForStudyPartner ? "text-accent" : "text-gray-200")} />
                </div>
              </button>
           </div>
        )}

        {/* Study Partner Badge (If not own profile) */}
        {!isOwnProfile && profile.isLookingForStudyPartner && (
            <div className="max-w-4xl mx-auto bg-accent/20 p-6 rounded-[2rem] flex items-center gap-4 border border-accent/30 animate-pulse-slow">
               <div className="p-3 bg-white/50 backdrop-blur rounded-2xl shadow-sm"><Zap className="w-6 h-6 text-accent fill-accent" /></div>
               <div>
                  <p className="text-sm font-black text-primary uppercase tracking-widest leading-none mb-1">Collaboration Alert</p>
                  <p className="text-xs font-bold text-primary/70 italic">This professional is seeking an academic partner for research or study.</p>
               </div>
               <button onClick={handleStartMessage} className="ml-auto bg-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark">Inquire Now</button>
            </div>
        )}

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto py-4">
           {activeTab === 'Posts' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center mb-8 px-2">
                 <h2 className="text-2xl font-serif font-black text-primary flex items-center gap-3">
                   <div className="w-1 h-6 bg-accent rounded-full" />
                   Professional Feed
                 </h2>
                 <div className="flex bg-white shadow-sm border border-gray-100 p-1.5 rounded-2xl">
                    <button className="p-2 bg-primary text-white rounded-xl shadow-lg"><List className="w-4 h-4" /></button>
                    <button className="p-2 text-gray-400 hover:text-primary transition-colors"><Grid className="w-4 h-4" /></button>
                 </div>
               </div>
               <div className="grid gap-6">
                 {posts.map(post => <PostCard key={post.id} post={post} />)}
               </div>
               {posts.length === 0 && (
                 <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-primary/10 text-gray-400">
                   <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                   <p className="text-sm font-black uppercase tracking-widest italic">No professional content shared yet.</p>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'Friends' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-2xl font-serif font-black text-primary flex items-center gap-3">
                    <div className="w-1 h-6 bg-accent rounded-full" />
                    Professional Circle
                  </h2>
                </div>
                
                {profile.friendListVisible === false && !isOwnProfile ? (
                   <div className="text-center py-24 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-sm font-black uppercase tracking-widest text-gray-400">Professional Circle Encrypted</p>
                      <p className="text-xs text-gray-400 italic mt-2">Visibility restricted by user policy.</p>
                   </div>
                ) : friends.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {friends.map(friend => (
                         <Link key={friend.id} to={`/profile/${friend.username.replace('@', '')}`} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-black overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                               {friend.image ? <img src={friend.image} className="w-full h-full object-cover" /> : friend.fullName?.[0]}
                            </div>
                            <div>
                               <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{friend.fullName}</p>
                               <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">{friend.username}</p>
                               <p className="text-[9px] text-primary/60 font-medium italic mt-1">{friend.department}</p>
                            </div>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                               <User className="w-4 h-4 text-primary" />
                            </div>
                         </Link>
                      ))}
                      {/* Friends of Friends suggestion */}
                      {!isOwnProfile && (
                         <div className="col-span-full pt-8 px-2">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">You may also know (Mutuals)</p>
                            <div className="bg-primary/5 p-8 rounded-[2rem] border border-dashed border-primary/20 text-center italic text-primary/60 text-sm font-medium">
                               Start expanding your professional network to see mutual connections.
                            </div>
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                      <p className="text-sm font-black uppercase tracking-widest text-gray-400 italic">Networking phase in progress.</p>
                   </div>
                )}
              </div>
           )}

           {activeTab === 'About' && (
             <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-gray-100 space-y-12">
               <div>
                  <h3 className="text-[10px] uppercase font-black text-gray-300 tracking-[0.3em] mb-6">Professional Narrative</h3>
                  <p className="text-gray-700 leading-loose text-2xl font-serif italic selection:bg-primary/20">
                    "{profile.bio || "This professional is currently crafting their narrative."}"
                  </p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-50">
                  <div className="space-y-6">
                     <h3 className="text-[10px] uppercase font-black text-gray-300 tracking-[0.3em]">Institutional Data</h3>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">College Faculty</p>
                        <p className="text-gray-800 font-bold">{profile.college}</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Departmental Focus</p>
                        <p className="text-gray-800 font-bold">{profile.department}</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-[10px] uppercase font-black text-gray-300 tracking-[0.3em]">Identity Verification</h3>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Matriculation ID</p>
                        <p className="text-gray-800 font-mono font-bold">{isOwnProfile ? profile.matricNumber : 'VERIFIED_HIDDEN'}</p>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Academic Timeline</p>
                        <p className="text-gray-800 font-bold">{profile.level} Professional Status</p>
                     </div>
                  </div>
               </div>
               
               <div className="pt-8 flex items-center gap-4 text-[10px] font-black text-gray-300 italic uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  LASUED Social Verified Professional
               </div>
             </div>
           )}
        </div>
      </div>
    </MainLayout>
  );
}

function formatDate(timestamp: any) {
  if (!timestamp) return 'recently';
  try {
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } catch {
    return 'recently';
  }
}

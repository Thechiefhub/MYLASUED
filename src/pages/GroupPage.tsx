import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import PostCard from '@/src/components/feed/PostCard';
import PostComposer from '@/src/components/feed/PostComposer';
import { Users, Info, MessageCircle, FileText, Settings, Loader2, ShieldCheck, ShieldAlert, User, Calendar, BookOpen, Plus, Download, Upload, MapPin, Copy, FolderPlus, Folder, Link as LinkIcon, Clock, ExternalLink, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [groupFiles, setGroupFiles] = useState<any[]>([]);
  const [groupFolders, setGroupFolders] = useState<any[]>([]);
  const [groupEvents, setGroupEvents] = useState<any[]>([]);
  const [fileUploaderOpen, setFileUploaderOpen] = useState(false);
  const [folderCreatorOpen, setFolderCreatorOpen] = useState(false);
  const [eventSchedulerOpen, setEventSchedulerOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFile, setNewFile] = useState({ name: '', topic: '', folder: 'General', url: 'https://placeholder.com/file' });
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', time: '', location: '', broadcastLink: '' });
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    
    // Listen to group folders
    const folderq = query(collection(db, 'groupFolders'), where('groupId', '==', groupId));
    const unsubscribeFolders = onSnapshot(folderq, (snapshot) => {
       setGroupFolders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to group files
    const fq = query(collection(db, 'groupFiles'), where('groupId', '==', groupId), orderBy('createdAt', 'desc'));
    const unsubscribeFiles = onSnapshot(fq, (snapshot) => {
      setGroupFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to group events
    const eq = query(collection(db, 'events'), where('groupId', '==', groupId), orderBy('date', 'asc'));
    const unsubscribeEvents = onSnapshot(eq, (snapshot) => {
      setGroupEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeFiles();
      unsubscribeEvents();
      unsubscribeFolders();
    };
  }, [groupId, user]);

  const handleFileUpload = async () => {
    if (!user || !groupId || !newFile.name) return;
    try {
      await addDoc(collection(db, 'groupFiles'), {
        ...newFile,
        uploaderId: user.uid,
        groupId,
        type: 'PDF',
        createdAt: serverTimestamp()
      });
      setNewFile({ name: '', topic: '', folder: 'General', url: 'https://placeholder.com/file' });
      setFileUploaderOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateFolder = async () => {
     if (!groupId || !newFolderName.trim()) return;
     try {
        await addDoc(collection(db, 'groupFolders'), {
           name: newFolderName.trim(),
           groupId,
           createdAt: serverTimestamp()
        });
        setNewFolderName('');
        setFolderCreatorOpen(false);
     } catch (err) {
        console.error(err);
     }
  };

  const handleScheduleEvent = async () => {
     if (!user || !groupId || !newEvent.title || !newEvent.date) return;
     try {
        await addDoc(collection(db, 'events'), {
           ...newEvent,
           organizerId: user.uid,
           groupId,
           category: 'STUDY_GROUP',
           createdAt: serverTimestamp()
        });
        setNewEvent({ title: '', description: '', date: '', time: '', location: '', broadcastLink: '' });
        setEventSchedulerOpen(false);
     } catch (err) {
        console.error(err);
     }
  };

  const copyInviteLink = () => {
     if (!group?.inviteCode) return;
     const link = `${window.location.origin}/join/${group.inviteCode}`;
     navigator.clipboard.writeText(link);
     setCopySuccess(true);
     setTimeout(() => setCopySuccess(false), 2000);
  };

  const generateInviteLink = async () => {
     if (!isAdmin || !groupId) return;
     const code = Math.random().toString(36).substring(2, 8).toUpperCase();
     try {
        await updateDoc(doc(db, 'groups', groupId), { inviteCode: code });
        setGroup({ ...group, inviteCode: code });
        alert(`Invite Code Generated: ${code}. Link: ${window.location.origin}/join/${code}`);
     } catch (err) {
        console.error(err);
     }
  };

  useEffect(() => {
    if (!groupId || !user) return;

    // Fetch group details
    const fetchGroup = async () => {
      const docSnap = await getDoc(doc(db, 'groups', groupId));
      if (docSnap.exists()) {
        const data = docSnap.id ? { id: docSnap.id, ...docSnap.data() } : docSnap.data();
        setGroup(data);
        if (data.creatorId === user.uid) setIsAdmin(true);
      }
    };
    fetchGroup();

    // Listen to group posts
    const q = query(
      collection(db, 'posts'), 
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setPosts(allPosts.filter(p => !p.scheduledAt || new Date(p.scheduledAt) <= new Date()));
      setScheduledPosts(allPosts.filter(p => p.scheduledAt && new Date(p.scheduledAt) > new Date()));
      setLoading(false);
    });

    // Listen to members
    const mq = query(collection(db, 'groups', groupId, 'members'));
    const unsubscribeMembers = onSnapshot(mq, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeMembers();
    };
  }, [groupId, user]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'groups', groupId!, 'members', memberId), {
        role: newRole
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (!group && !loading) return <MainLayout><div className="text-center p-12">Group not found</div></MainLayout>;

  const tabs = [
    { label: 'Feed', icon: FileText },
    { label: 'Files', icon: BookOpen },
    { label: 'Events', icon: Calendar },
    { label: 'Members', icon: Users },
    { label: 'About', icon: Info },
  ];

  return (
    <MainLayout>
      {loading ? (
        <div className="flex items-center justify-center p-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group Header */}
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="h-48 bg-primary-light relative">
              {group.coverImage && <img src={group.coverImage} className="w-full h-full object-cover" />}
            </div>
            <div className="p-6 md:p-8 -mt-12 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-lg overflow-hidden">
                   <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                    <Users className="w-10 h-10" />
                   </div>
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-serif text-gray-900">{group.name}</h1>
                    <span className="text-[10px] bg-primary-light text-primary font-black uppercase px-2 py-0.5 rounded tracking-tighter">
                      {group.category}
                    </span>
                  </div>
                  <p className="text-gray-500 font-medium">@{group.id} • {group.memberCount || 0} Members</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-sm shadow-primary/20">
                  Joined
                </button>
                <button className="p-3 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-xl transition-colors border border-gray-100">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Bar */}
            <div className="px-8 flex border-t border-gray-50">
              {tabs.map(tab => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all",
                    activeTab === tab.label 
                      ? "border-primary text-primary" 
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-2xl mx-auto py-4">
             {activeTab === 'Members' && (
                <div className="space-y-4">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-serif text-primary">Group Members</h3>
                      <div className="flex items-center gap-4">
                         <span className="text-xs font-bold text-gray-400">{members.length} members total</span>
                         <Link 
                           to={`/groups/${groupId}/members`}
                           className="text-xs font-black uppercase text-primary hover:underline tracking-widest flex items-center gap-1"
                         >
                            View All <Users className="w-3 h-3" />
                         </Link>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      {members.map(member => (
                         <div key={member.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                                  {member.fullName?.[0] || 'U'}
                               </div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <p className="font-bold text-gray-900">{member.fullName}</p>
                                     {member.role === 'ADMIN' && (
                                        <div className="flex items-center gap-1 bg-primary px-2 py-0.5 rounded text-[8px] font-black uppercase text-white tracking-widest">
                                           <ShieldCheck className="w-2 h-2" /> Admin
                                        </div>
                                     )}
                                     {member.role === 'MODERATOR' && (
                                        <div className="flex items-center gap-1 bg-accent px-2 py-0.5 rounded text-[8px] font-black uppercase text-white tracking-widest">
                                           <ShieldAlert className="w-2 h-2" /> Mod
                                        </div>
                                     )}
                                  </div>
                                  <p className="text-xs text-gray-400">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                               </div>
                            </div>
                            {isAdmin && member.id !== user?.uid && (
                               <div className="flex items-center gap-2">
                                  <select 
                                    className="text-[10px] font-bold border border-gray-100 rounded-lg p-1 bg-gray-50 focus:outline-none"
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                  >
                                     <option value="MEMBER">Member</option>
                                     <option value="MODERATOR">Moderator</option>
                                     <option value="ADMIN">Admin</option>
                                  </select>
                               </div>
                            )}
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {activeTab === 'Feed' && (
               <div className="space-y-6">
                 <PostComposer groupId={groupId} />

                 {/* Scheduled Dashboard for Admins */}
                 {isAdmin && scheduledPosts.length > 0 && (
                    <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-6">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-primary">
                             <Calendar className="w-5 h-5" />
                             <h4 className="font-serif font-bold text-lg">Scheduled Broadcasts</h4>
                          </div>
                          <span className="text-[10px] font-black uppercase text-accent tracking-widest">{scheduledPosts.length} Upcoming</span>
                       </div>
                       <div className="space-y-3">
                          {scheduledPosts.map(post => (
                             <div key={post.id} className="bg-white p-3 rounded-xl border border-accent/10 flex items-center justify-between">
                                <div className="flex-1 overflow-hidden">
                                   <p className="text-xs font-medium text-gray-700 truncate">{post.content}</p>
                                   <p className="text-[10px] text-accent font-bold mt-1">Scheduled for: {new Date(post.scheduledAt).toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={async () => await deleteDoc(doc(db, 'posts', post.id))}
                                  className="text-[10px] font-black text-danger uppercase ml-4"
                                >
                                  Cancel
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 <div className="space-y-4">
                   {posts.map(post => <PostCard key={post.id} post={post} />)}
                   {posts.length === 0 && (
                     <div className="text-center p-12 text-gray-400 italic">No posts in this group yet.</div>
                   )}
                 </div>
               </div>
             )}
             
             {activeTab === 'Files' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif text-primary">Study Materials</h3>
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setFolderCreatorOpen(true)}
                           className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-xl text-xs font-bold hover:bg-accent/20 transition-all border border-accent/20"
                         >
                            <FolderPlus className="w-3.5 h-3.5" /> New Folder
                         </button>
                         <button 
                           onClick={() => setFileUploaderOpen(true)}
                           className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-dark transition-all"
                         >
                            <Upload className="w-3.5 h-3.5" /> Upload Material
                         </button>
                      </div>
                   </div>

                   {folderCreatorOpen && (
                      <div className="bg-white p-6 rounded-2xl border border-accent/10 shadow-lg animate-in fade-in slide-in-from-top-2">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                              <FolderPlus className="w-5 h-5 text-accent" /> Create New Folder
                            </h4>
                            <button onClick={() => setFolderCreatorOpen(false)}><X className="w-4 h-4 text-gray-300" /></button>
                         </div>
                         <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="Folder Name (e.g. Past Questions, Lecture Notes)"
                              className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            <button 
                              onClick={handleCreateFolder}
                              className="bg-primary text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                            >
                               Create
                            </button>
                         </div>
                      </div>
                   )}

                   {fileUploaderOpen && (
                      <div className="bg-white p-6 rounded-2xl border border-primary/10 shadow-lg animate-in fade-in zoom-in-95">
                         <div className="flex items-center justify-between mb-4">
                            <h4 className="font-serif font-bold text-lg text-primary flex items-center gap-2">
                              <Upload className="w-5 h-5" /> Share Material
                            </h4>
                            <button onClick={() => setFileUploaderOpen(false)}><X className="w-4 h-4 text-gray-300" /></button>
                         </div>
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Document Label</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. CSC 201 Notes"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                                    value={newFile.name}
                                    onChange={(e) => setNewFile({...newFile, name: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Target Folder</label>
                                  <select 
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                                    value={newFile.folder}
                                    onChange={(e) => setNewFile({...newFile, folder: e.target.value})}
                                  >
                                     <option value="General">General</option>
                                     {groupFolders.map(folder => (
                                        <option key={folder.id} value={folder.name}>{folder.name}</option>
                                     ))}
                                  </select>
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Course / Topic</label>
                               <input 
                                 type="text" 
                                 placeholder="e.g. Operating Systems"
                                 className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary/10 outline-none"
                                 value={newFile.topic}
                                 onChange={(e) => setNewFile({...newFile, topic: e.target.value})}
                               />
                            </div>
                            <div className="pt-2">
                               <button 
                                 onClick={handleFileUpload}
                                 className="w-full bg-primary text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all"
                               >
                                  Commit to Repository
                               </button>
                            </div>
                         </div>
                      </div>
                   )}

                   <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                      {['All', 'General', ...groupFolders.map(f => f.name)].map(folder => (
                         <button 
                           key={folder}
                           onClick={() => setActiveFolder(folder === 'All' ? null : folder)}
                           className={cn(
                              "px-5 py-2.5 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all border-2",
                              (activeFolder === folder || (folder === 'All' && activeFolder === null))
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                : "bg-white text-gray-400 border-gray-100 hover:border-primary/20"
                           )}
                         >
                            {folder}
                         </button>
                      ))}
                   </div>

                   <div className="space-y-4">
                      {groupFiles.filter(f => !activeFolder || f.folder === activeFolder).map(file => (
                         <div key={file.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all">
                            <div className="flex items-center gap-5">
                               <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-black overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                  {file.type === 'PDF' ? <FileText className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                               </div>
                               <div>
                                  <div className="flex items-center gap-3">
                                     <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{file.name}</p>
                                     <span className="text-[8px] bg-accent/10 text-accent font-black px-2 py-0.5 rounded uppercase tracking-widest border border-accent/10">
                                        {file.folder || 'General'}
                                     </span>
                                  </div>
                                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1 italic opacity-60">Topic: {file.topic}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <button className="p-4 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary-light rounded-2xl transition-all shadow-sm">
                                  <Download className="w-5 h-5" />
                               </button>
                            </div>
                         </div>
                      ))}
                      {groupFiles.filter(f => !activeFolder || f.folder === activeFolder).length === 0 && (
                         <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <Folder className="w-16 h-16 text-gray-200 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-black uppercase tracking-widest text-gray-400 italic">This directory is currently empty.</p>
                         </div>
                      )}
                   </div>
                </div>
             )}

             {activeTab === 'Events' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xl font-serif text-primary">Study Events</h3>
                      {isAdmin && (
                         <button 
                           onClick={() => setEventSchedulerOpen(true)}
                           className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                         >
                            <Plus className="w-4 h-4" /> Schedule Event
                         </button>
                      )}
                   </div>

                   {eventSchedulerOpen && (
                      <div className="bg-white p-8 rounded-[2rem] border border-primary/10 shadow-2xl animate-in fade-in slide-in-from-top-4">
                         <div className="flex items-center justify-between mb-6">
                            <h4 className="font-serif font-black text-2xl text-primary italic">Event Protocol</h4>
                            <button onClick={() => setEventSchedulerOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X className="w-5 h-5 text-gray-300" /></button>
                         </div>
                         
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Event Designation (Title)</label>
                               <input 
                                 type="text" 
                                 placeholder="e.g. MTH 101 Intensive Review"
                                 className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all"
                                 value={newEvent.title}
                                 onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                               />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Date</label>
                                  <div className="relative">
                                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                     <input 
                                       type="date" 
                                       className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-primary outline-none transition-all"
                                       value={newEvent.date}
                                       onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                     />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Time</label>
                                  <div className="relative">
                                     <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                     <input 
                                       type="time" 
                                       className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-primary outline-none transition-all"
                                       value={newEvent.time}
                                       onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                                     />
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Geographical Data (Location)</label>
                               <div className="relative">
                                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Block A Room 4 / Online via Zoom"
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-primary outline-none transition-all"
                                    value={newEvent.location}
                                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                  />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Broadcast Connection (Optional Link)</label>
                               <div className="relative">
                                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                  <input 
                                    type="text" 
                                    placeholder="Paste link to Main Broadcasts module..."
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-primary outline-none transition-all"
                                    value={newEvent.broadcastLink}
                                    onChange={(e) => setNewEvent({...newEvent, broadcastLink: e.target.value})}
                                  />
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Detailed Narrative</label>
                               <textarea 
                                 placeholder="What should members expect?"
                                 rows={3}
                                 className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all resize-none"
                                 value={newEvent.description}
                                 onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                               />
                            </div>

                            <div className="pt-2">
                               <button 
                                 onClick={handleScheduleEvent}
                                 className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center gap-3"
                               >
                                  Establish Event <Calendar className="w-5 h-5" />
                               </button>
                            </div>
                         </div>
                      </div>
                   )}

                   <div className="space-y-5">
                      {groupEvents.map(event => (
                         <div key={event.id} className="bg-white rounded-[2rem] border border-gray-100 flex overflow-hidden shadow-xl shadow-primary/5 hover:border-primary/20 transition-all group">
                            <div className="w-24 bg-primary flex flex-col items-center justify-center text-white border-r border-white/10 group-hover:bg-primary-dark transition-colors">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                  {new Date(event.date).toLocaleString('default', { month: 'short' })}
                                </span>
                               <span className="text-3xl font-serif font-black">{new Date(event.date).getDate()}</span>
                            </div>
                            <div className="flex-1 p-6 space-y-4">
                               <div>
                                  <h4 className="font-serif font-black text-xl text-gray-900 group-hover:text-primary transition-colors">{event.title}</h4>
                                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase text-gray-400 tracking-widest mt-2">
                                     <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-accent" /> {event.time || 'TBA'}
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5 text-accent" /> {event.location || 'Online'}
                                     </div>
                                  </div>
                               </div>
                               <p className="text-xs text-gray-500 font-medium leading-relaxed italic">{event.description}</p>
                               
                               {event.broadcastLink && (
                                  <a 
                                    href={event.broadcastLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                                  >
                                     Transmission Link <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                               )}
                            </div>
                         </div>
                      ))}
                      {groupEvents.length === 0 && (
                         <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-black uppercase tracking-widest text-gray-400 italic">Static calendar. No active operations scheduled.</p>
                         </div>
                      )}
                   </div>
                </div>
             )}

              {activeTab === 'About' && (
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 space-y-10 shadow-xl shadow-primary/5">
                   <div className="space-y-4">
                     <h3 className="text-[10px] uppercase font-black text-primary/40 tracking-[0.3em] ml-1">Group Objective</h3>
                     <p className="text-gray-700 leading-loose text-lg font-serif italic selection:bg-primary/10">"{group.description}"</p>
                   </div>

                   {isAdmin && (
                     <div className="pt-10 border-t border-gray-50 space-y-6">
                        <div className="flex items-center justify-between">
                           <h3 className="text-[10px] uppercase font-black text-accent tracking-[0.3em] ml-1">Personnel Induction</h3>
                           <button 
                             onClick={generateInviteLink}
                             className="text-[10px] font-black uppercase text-primary hover:underline underline-offset-4"
                           >
                              Refresh Code
                           </button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-3xl p-8 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                           {group.inviteCode ? (
                              <>
                                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl border border-gray-50">
                                    <LinkIcon className="w-8 h-8" />
                                 </div>
                                 <div>
                                    <p className="text-xl font-serif font-black text-gray-900 tracking-tighter mb-1">Induction Portal Ready</p>
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">{window.location.origin}/join/{group.inviteCode}</p>
                                 </div>
                                 <button 
                                   onClick={copyInviteLink}
                                   className={cn(
                                      "px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                                      copySuccess ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-primary text-white hover:bg-primary-dark shadow-xl shadow-primary/20"
                                   )}
                                 >
                                    {copySuccess ? "Copied!" : "Copy Portal Link"}
                                    {copySuccess ? <ShieldCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                 </button>
                              </>
                           ) : (
                              <button 
                                onClick={generateInviteLink}
                                className="bg-primary text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-dark transition-all flex items-center gap-4 shadow-xl shadow-primary/20"
                              >
                                 <Plus className="w-6 h-6" /> Generate Invite Code
                              </button>
                           )}
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 gap-12 pt-10 border-t border-gray-50">
                     <div className="space-y-2">
                       <h3 className="text-[10px] uppercase font-black text-gray-300 tracking-widest">Protocol Creator</h3>
                       <p className="font-black text-primary uppercase tracking-tighter text-xl italic flex items-center gap-2">
                          <User className="w-5 h-5 opacity-40" />
                          @Admin_Ops
                       </p>
                     </div>
                     <div className="space-y-2">
                       <h3 className="text-[10px] uppercase font-black text-gray-300 tracking-widest">Access Policy</h3>
                       <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", group.isPrivate ? "bg-accent" : "bg-green-500")} />
                          <p className="font-black text-primary uppercase tracking-widest text-sm">{group.isPrivate ? 'Confidential' : 'Open Access'}</p>
                       </div>
                     </div>
                   </div>
                </div>
              )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}

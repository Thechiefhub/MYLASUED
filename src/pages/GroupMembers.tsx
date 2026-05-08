import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import { Users, ShieldCheck, ShieldAlert, ChevronLeft, Search, UserPlus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function GroupMembers() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;

    // Fetch group details
    const fetchGroup = async () => {
      const docSnap = await getDoc(doc(db, 'groups', groupId));
      if (docSnap.exists()) {
        const data: any = { id: docSnap.id, ...docSnap.data() };
        setGroup(data);
        if (data.creatorId === user.uid) setIsAdmin(true);
      }
    };
    fetchGroup();

    // Listen to members
    const mq = query(collection(db, 'groups', groupId, 'members'));
    const unsubscribeMembers = onSnapshot(mq, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribeMembers();
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

  const filteredMembers = members.filter(m => 
    m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!group && !loading) return <MainLayout><div className="text-center p-12">Group not found</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-3 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all shadow-sm"
              >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                 <h1 className="text-3xl font-serif font-black text-primary italic">Group Personnel</h1>
                 <p className="text-xs font-black uppercase text-gray-400 tracking-widest">{group?.name} • Personnel Log</p>
              </div>
           </div>
           
           <div className="hidden md:flex bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm items-center gap-3 px-4">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search personnel..."
                className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {filteredMembers.map(member => (
              <div key={member.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-primary/5 group hover:border-primary/20 transition-all flex items-center justify-between">
                 <div className="flex items-center gap-5">
                    <div className="relative">
                       <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-black text-xl border-4 border-white shadow-lg overflow-hidden">
                          {member.image ? <img src={member.image} className="w-full h-full object-cover" /> : member.fullName?.[0]}
                       </div>
                       {member.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
                       )}
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-gray-900">{member.fullName}</p>
                          {member.role === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-primary" />}
                          {member.role === 'MODERATOR' && <ShieldAlert className="w-4 h-4 text-accent" />}
                       </div>
                       <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1 italic">@{member.username || 'System_User'}</p>
                       <div className="flex items-center gap-2">
                          <span className={cn(
                             "text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-tighter",
                             member.role === 'ADMIN' ? "bg-primary text-white" : 
                             member.role === 'MODERATOR' ? "bg-accent text-white" : "bg-gray-100 text-gray-400"
                          )}>
                             {member.role}
                          </span>
                          <span className="text-[8px] font-bold text-gray-300 italic">Established {new Date(member.joinedAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>

                 {isAdmin && member.id !== user?.uid && (
                    <div className="flex flex-col gap-2">
                       <select 
                         className="text-[10px] font-black uppercase tracking-widest border-2 border-gray-50 rounded-xl p-2 bg-gray-50 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                         value={member.role}
                         onChange={(e) => handleRoleChange(member.id, e.target.value)}
                       >
                          <option value="MEMBER">Member</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                       </select>
                       <button className="text-[8px] font-black uppercase text-danger text-center opacity-0 group-hover:opacity-100 transition-opacity">Decommission</button>
                    </div>
                 )}
                 
                 {!isAdmin && member.id !== user?.uid && (
                    <Link to={`/profile/${member.username}`} className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:text-primary transition-colors">
                       <UserPlus className="w-4 h-4" />
                    </Link>
                 )}
              </div>
           ))}
        </div>

        {filteredMembers.length === 0 && !loading && (
           <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <Users className="w-16 h-16 text-gray-200 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-black uppercase tracking-widest text-gray-400 italic">No personnel found matching search parameters.</p>
           </div>
        )}
      </div>
    </MainLayout>
  );
}

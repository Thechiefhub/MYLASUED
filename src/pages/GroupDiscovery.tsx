import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import MainLayout from '@/src/components/layout/MainLayout';
import { Search, Plus, Users, Shield, Lock, BookOpen, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function GroupDiscovery() {
  const [groups, setGroups] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [studyPartners, setStudyPartners] = useState<any[]>([]);
  const [deptFilter, setDeptFilter] = useState('');

  const categories = ["All", "Business Forum", "Motivational", "Amebo Gist", "Brainstorming", "Department Connect", "Official"];
  const depts = ["Mathematics Education", "Biology Education", "Chemistry Education", "English Education", "Accounting Education"];

  useEffect(() => {
    const q = query(collection(db, 'groups'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen for study partners
    const sq = query(collection(db, 'users'), where('isLookingForStudyPartner', '==', true));
    const unsubscribePartners = onSnapshot(sq, (snapshot) => {
      setStudyPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribePartners();
    };
  }, []);

  const filteredGroups = filter === 'All' ? groups : groups.filter(g => g.category === filter);
  const filteredPartners = deptFilter === '' ? studyPartners : studyPartners.filter(p => p.department === deptFilter);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">Discover Groups</h1>
            <p className="text-gray-500">Communities and hubs for every interest at LASUED.</p>
          </div>
          <Link 
            to="/groups/create" 
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all self-start shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === cat ? "bg-primary text-white" : "bg-white text-gray-500 border border-gray-100 hover:border-primary/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Link 
                key={group.id}
                to={`/groups/${group.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="h-32 bg-primary-light relative overflow-hidden">
                  {group.coverImage ? (
                    <img src={group.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <Users className="w-16 h-16 text-primary" />
                    </div>
                  )}
                  {group.isOfficial && (
                    <div className="absolute top-3 left-3 bg-primary text-white text-[10px] uppercase font-black px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                      <Shield className="w-3 h-3" />
                      Official
                    </div>
                  )}
                  {group.isPrivate && (
                    <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-md text-white p-1.5 rounded-full">
                      <Lock className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary-light px-2 py-0.5 rounded">
                      {group.category}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {group.memberCount || 0} Members
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{group.name}</h3>
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{group.description}</p>
                </div>
              </Link>
            ))}

            {filteredGroups.length === 0 && (
              <div className="col-span-full py-24 text-center">
                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No groups found in this category yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Study Partner Section */}
        <div className="pt-12 border-t border-gray-100">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-serif text-primary mb-2">Find a Study Partner</h2>
                <p className="text-gray-500">Connect with students looking for academic collaboration.</p>
              </div>
              <select 
                className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {depts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPartners.map(partner => (
                <Link 
                  key={partner.id}
                  to={`/profile/${partner.username}`}
                  className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                    {partner.fullName[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm truncate">{partner.fullName}</p>
                    <p className="text-[10px] font-medium text-gray-400 truncate">{partner.department}</p>
                  </div>
                  <div className="ml-auto w-2 h-2 bg-green-500 rounded-full" />
                </Link>
              ))}
              {filteredPartners.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 italic">
                  No partners currently looking in this department.
                </div>
              )}
           </div>
        </div>
      </div>
    </MainLayout>
  );
}

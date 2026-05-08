import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import { Loader2, Users, CheckCircle, XCircle } from 'lucide-react';

export default function JoinGroup() {
  const { code } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<any>(null);

  useEffect(() => {
    async function verifyAndJoin() {
      if (!code || !user) return;
      
      try {
        const q = query(collection(db, 'groups'), where('inviteCode', '==', code));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError("Invalid invite code.");
          setLoading(false);
          return;
        }

        const groupData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setGroup(groupData);

        // Add user to members
        await setDoc(doc(db, 'groups', groupData.id, 'members', user.uid), {
          fullName: profile?.fullName,
          role: 'MEMBER',
          joinedAt: new Date().toISOString()
        });

        setLoading(false);
        setTimeout(() => navigate(`/group/${groupData.id}`), 2000);
      } catch (err) {
        console.error(err);
        setError("Failed to join group.");
        setLoading(false);
      }
    }

    verifyAndJoin();
  }, [code, user, profile, navigate]);

  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-24 text-center space-y-6">
         {loading && (
            <div className="space-y-4">
               <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
               <h1 className="text-2xl font-serif text-primary">Joining Group...</h1>
               <p className="text-gray-500">Verifying your invite code for {code}.</p>
            </div>
         )}

         {!loading && !error && group && (
            <div className="space-y-4 animate-in zoom-in-95">
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
               </div>
               <h1 className="text-3xl font-serif text-primary">Welcome to {group.name}!</h1>
               <p className="text-gray-500">You have been successfully added to the study group. Redirecting you now...</p>
            </div>
         )}

         {error && (
            <div className="space-y-4 animate-in shake">
               <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-10 h-10" />
               </div>
               <h1 className="text-2xl font-serif text-red-600">Error</h1>
               <p className="text-gray-500">{error}</p>
               <button 
                 onClick={() => navigate('/groups')}
                 className="bg-primary text-white px-8 py-3 rounded-xl font-bold"
               >
                  Back to Discovery
               </button>
            </div>
         )}
      </div>
    </MainLayout>
  );
}

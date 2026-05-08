import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data();
          setProfile(profileData);
          
          // Set online status
          await updateDoc(docRef, {
            isOnline: true,
            lastSeen: serverTimestamp()
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Update lastSeen periodically if user is authenticated
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastSeen: serverTimestamp(),
          isOnline: true
        });
      } catch (err) {
        console.error('Online heartbeat failed:', err);
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateDoc(doc(db, 'users', user.uid), { isOnline: false });
      } else {
        updateDoc(doc(db, 'users', user.uid), { isOnline: true, lastSeen: serverTimestamp() });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', () => {
       updateDoc(doc(db, 'users', user.uid), { isOnline: false });
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';

export default function ReminderService() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      // Fetch upcoming events
      const now = new Date();
      const in30Mins = new Date(now.getTime() + 30 * 60 * 1000);
      
      const q = query(
        collection(db, 'events'), 
        where('date', '>=', now.toISOString()),
        where('date', '<=', in30Mins.toISOString())
      );

      const snap = await getDocs(q);
      
      for (const eventDoc of snap.docs) {
        const event = eventDoc.data();
        
        // Check if reminder already sent
        const rq = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('type', '==', 'EVENT_REMINDER'),
          where('link', '==', `/events?id=${eventDoc.id}`)
        );
        const rSnap = await getDocs(rq);

        if (rSnap.empty) {
          await addDoc(collection(db, 'notifications'), {
            userId: user.uid,
            title: '📅 Session Starting Soon',
            content: `"${event.title}" starts in less than 30 minutes. Be prepared!`,
            type: 'EVENT_REMINDER',
            link: `/events?id=${eventDoc.id}`,
            isRead: false,
            createdAt: serverTimestamp()
          });
        }
      }
    };

    // Run once on load and then every 5 minutes
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}

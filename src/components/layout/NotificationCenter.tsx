import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import { Bell, Calendar, Zap, MessageSquare, Check, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'EVENT_REMINDER': return <Calendar className="w-4 h-4 text-primary" />;
      case 'GOAL': return <Zap className="w-4 h-4 text-accent" />;
      case 'MENTION': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
        className="relative p-2.5 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 transition-all group"
      >
        <Bell className="w-5 h-5 text-gray-500 group-hover:text-primary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl border border-gray-100 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
            <div className="p-5 border-b border-gray-50 flex items-center justify-between">
               <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest">Notifications</h3>
               <button onClick={markAllAsRead} className="text-[10px] font-bold text-primary hover:underline">Mark all read</button>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={cn(
                    "p-5 flex gap-4 transition-colors hover:bg-gray-50",
                    !notif.isRead && "bg-primary/5"
                  )}
                >
                  <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-gray-900 leading-snug">{notif.title}</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">{notif.content}</p>
                    <div className="pt-2 flex items-center justify-between">
                       <span className="text-[9px] font-medium text-gray-400">2h ago</span>
                       {notif.link && (
                          <Link to={notif.link} className="flex items-center gap-1 text-[9px] font-black text-primary uppercase hover:underline">
                             View Details <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                       )}
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="p-12 text-center">
                  <Bell className="w-8 h-8 text-gray-100 mx-auto mb-3" />
                  <p className="text-xs text-gray-400 font-medium">No alerts for now.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

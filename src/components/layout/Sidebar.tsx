import { LucideIcon, Home, LayoutGrid, Users, ShoppingBag, MessageCircle, Bell, Trophy, Zap, User, Settings, Search } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/lib/authContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isCollapsed?: boolean;
  badge?: number;
}

function NavItem({ href, icon: Icon, label, isCollapsed, badge }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
        isActive 
          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
          : "text-gray-500 hover:bg-primary-light hover:text-primary"
      )}
    >
      <Icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-primary transition-colors")} />
      {!isCollapsed && <span className={cn("font-bold text-sm tracking-tight", isActive ? "text-white" : "")}>{label}</span>}
      {badge ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] flex items-center justify-center animate-pulse">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function Sidebar({ className }: { className?: string }) {
  const { profile, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('isRead', '==', false)
    );
    return onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
  }, [user]);
  
  return (
    <aside className={cn("w-64 border-r border-gray-100 bg-white h-screen sticky top-0 flex flex-col p-6 gap-8", className)}>
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-serif font-black italic text-xl shadow-lg shadow-primary/20">L</div>
        <div className="flex flex-col">
          <span className="text-primary font-serif font-black text-2xl tracking-tighter italic leading-none">LASUED</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Professional</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        <NavItem href="/feed" label="Social Feed" icon={Home} />
        <NavItem href="/find-friends" label="Find Friends" icon={Search} />
        {profile?.department && (
          <NavItem href={`/department/${profile.department}`} label="Dept Hub" icon={LayoutGrid} />
        )}
        <NavItem href="/groups" label="Communities" icon={Users} />
        <NavItem href="/marketplace" label="Marketplace" icon={ShoppingBag} />
        <NavItem href="/messages" label="Campus Chat" icon={MessageCircle} />
        <NavItem href="/notifications" label="Notifications" icon={Bell} badge={unreadCount} />
        <NavItem href="/leaderboard" label="Hall of Fame" icon={Trophy} />
        <NavItem href="/brainstorm" label="Study Hubs" icon={Zap} />
      </nav>

      <div className="mt-auto flex flex-col gap-1.5 pt-6 border-t border-gray-50">
        <NavItem href="/profile" label="My Profile" icon={User} />
        <NavItem href="/settings" label="Portal Settings" icon={Settings} />
      </div>
    </aside>
  );
}

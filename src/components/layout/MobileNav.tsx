import { Home, Users, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function MobileNav({ className }: { className?: string }) {
  const location = useLocation();

  const items = [
    { href: '/feed', icon: Home, label: 'Feed' },
    { href: '/groups', icon: Users, label: 'Groups' },
    { href: '/marketplace', icon: ShoppingBag, label: 'Market' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 px-4 flex items-center justify-around z-40", className)}>
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link 
            key={item.href}
            to={item.href} 
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-gray-400"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-primary/10")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  );
}

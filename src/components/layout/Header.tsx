import { Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '@/src/lib/authContext';

export default function Header() {
  const { profile } = useAuth();

  return (
    <header className="h-20 border-b border-gray-100 bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex md:hidden items-center gap-2">
        <span className="text-primary font-serif font-black text-2xl tracking-tighter italic">LASUED</span>
      </div>

      <div className="hidden md:flex flex-1 max-w-sm relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="Search materials, groups..." 
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
        />
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <NotificationCenter />
        
        <Link to="/profile" className="flex items-center gap-2 p-1.5 pl-1.5 pr-4 bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary overflow-hidden font-bold">
            {profile?.image ? <img src={profile.image} className="w-full h-full object-cover" /> : (profile?.fullName?.[0] || <User className="w-5 h-5" />)}
          </div>
          <div className="hidden sm:block text-left">
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Profile</p>
             <p className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[100px]">{profile?.fullName?.split(' ')[0] || 'User'}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

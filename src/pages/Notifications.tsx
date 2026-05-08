import MainLayout from '@/src/components/layout/MainLayout';
import { Bell, Heart, MessageCircle, UserPlus, ShoppingBag, Radio } from 'lucide-react';

export default function Notifications() {
  const notifications = [
    { type: 'LIKE', user: '@tolulope_ade', text: 'liked your post', time: '2m ago', icon: Heart, color: 'text-danger' },
    { type: 'COMMENT', user: '@chief_lasued', text: 'commented on your project', time: '15m ago', icon: MessageCircle, color: 'text-primary' },
    { type: 'FOLLOW', user: '@joy_maths', text: 'followed you', time: '1h ago', icon: UserPlus, color: 'text-secondary' },
    { type: 'BROADCAST', user: 'Admin', text: 'sent an official broadcast', time: '3h ago', icon: Radio, color: 'text-accent' },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif text-primary">Notifications</h1>
          <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors">Mark all as read</button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {notifications.map((n, i) => (
            <div key={i} className="p-4 md:p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50">
              <div className={`p-3 rounded-2xl bg-gray-50 ${n.color}`}>
                <n.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-gray-800 text-sm md:text-base">
                  <span className="font-bold">{n.user}</span> {n.text}
                </p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

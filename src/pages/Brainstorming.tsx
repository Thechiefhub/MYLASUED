import MainLayout from '@/src/components/layout/MainLayout';
import { Zap, BookOpen, MessageSquare, Code, GraduationCap, Microscope, Plus } from 'lucide-react';

const hubs = [
  { icon: GraduationCap, name: "MAT 301 Study Group", members: 12, category: "Course Study" },
  { icon: Code, name: "Coding for Beginners", members: 45, category: "Skill Share" },
  { icon: MessageSquare, name: "Current Affairs Debate", members: 89, category: "Debate" },
  { icon: Microscope, name: "Chemistry Lab Prep", members: 8, category: "Research" },
];

export default function Brainstorming() {
  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif text-primary mb-2">Brainstorming Hubs</h1>
            <p className="text-gray-500">Collaborative study sessions and skill-sharing centers.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all self-start shadow-sm shadow-primary/20">
            <Plus className="w-5 h-5" />
            Create Hub
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.map((hub, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <hub.icon className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{hub.category}</p>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">{hub.name}</h3>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                <span className="text-xs font-bold text-gray-400">{hub.members} active members</span>
                <button className="text-xs font-bold text-primary hover:underline">Join Hub</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 rounded-3xl p-12 text-center border-2 border-dashed border-primary/10">
          <Zap className="w-16 h-16 text-primary/20 mx-auto mb-4" />
          <h3 className="text-2xl font-serif text-primary mb-2">Collaborative Learning</h3>
          <p className="text-gray-500 max-w-md mx-auto italic">Shared whiteboards, shared notes, and live group calls — all within your brainstorming hubs.</p>
        </div>
      </div>
    </MainLayout>
  );
}

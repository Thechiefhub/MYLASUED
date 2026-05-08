import { BookOpen, Users, ShoppingBag, Bell, MessageCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { icon: BookOpen, title: "College Connections", description: "Meet students across all departments and colleges." },
  { icon: Users, title: "Groups & Communities", description: "Join or create groups for any interest or study field." },
  { icon: ShoppingBag, title: "Campus Marketplace", description: "Buy and sell within the LASUED community securely." },
  { icon: Bell, title: "Official Broadcasts", description: "Never miss important school announcements and alerts." },
  { icon: MessageCircle, title: "Real-time Chat", description: "DM anyone, group chats, voice & video calls." },
  { icon: Zap, title: "Brainstorming Hubs", description: "Collaborate, learn, and grow together effectively." },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 scale-105">
           <img 
            src="https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?auto=format&fit=crop&q=80&w=2000" 
            alt="LASUED Campus" 
            className="w-full h-full object-cover opacity-10 grayscale" 
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/5"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-8xl font-serif text-primary leading-tight mb-6">
              Connect. Learn. <span className="italic text-accent">Grow.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 font-medium">
              The official social platform for Lagos State University of Education students.
            </p>
            <div className="flex gap-4">
              <Link to="/signup" className="bg-primary text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all transform hover:-translate-y-1">
                Join Mylasued
              </Link>
              <Link to="/signin" className="border-2 border-primary text-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-light transition-all">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-primary mb-4">Everything you need in one place</h2>
            <p className="text-gray-500">Designed specifically for the unique needs of LASUED students.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-primary/20 transition-all group">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
           <h2 className="text-4xl font-serif text-primary mb-12">What Students Say</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60 italic">
              <div>"Coming soon to LASUED..."</div>
              <div>"Coming soon to LASUED..."</div>
              <div>"Coming soon to LASUED..."</div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-12 text-white/90">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-white/40 font-medium">my</span>
            <span className="text-white font-bold text-2xl uppercase tracking-tighter">lasued</span>
          </div>
          <div className="text-center font-medium italic">
            "We're Unique and Professional"
          </div>
          <div className="text-sm opacity-60">
            © 2024 Mylasued. All rights reserved. Lagos State University of Education.
          </div>
        </div>
      </footer>
    </div>
  );
}

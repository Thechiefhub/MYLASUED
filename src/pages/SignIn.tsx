import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/feed');
    } catch (err) {
      console.error(err);
      alert('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-primary p-12 text-white flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/40 font-medium">my</span>
          <span className="text-white font-bold text-2xl uppercase tracking-tighter">lasued</span>
        </div>
        <div>
          <h1 className="text-5xl font-serif mb-6 leading-tight">Welcome back Professional.</h1>
          <p className="text-white/70 text-lg">Continue connecting with your peers and staying updated with the LASUED community.</p>
        </div>
        <div className="text-sm border-t border-white/20 pt-4">
          "We're Unique and Professional"
        </div>
      </div>

      <div className="p-6 md:p-12 flex items-center">
        <div className="max-w-md mx-auto w-full">
          <div className="lg:hidden mb-8 flex justify-center">
             <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">my</span>
              <span className="text-primary font-bold text-2xl uppercase tracking-tighter">lasued</span>
            </div>
          </div>

          <h2 className="text-3xl font-serif text-primary mb-2">Sign In</h2>
          <p className="text-gray-500 mb-8">Reconnect with the LASUED community.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-gray-500 mb-1 tracking-wider">Email Address</label>
              <input 
                required
                type="email" 
                placeholder="student@lasued.edu.ng"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs uppercase font-bold text-gray-500 tracking-wider">Password</label>
                <Link to="/forgot-password" virtual className="text-xs text-primary font-bold hover:underline">Forgot Password?</Link>
              </div>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all disabled:opacity-50 mt-4 shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : "Sign In"}
            </button>

            <p className="text-center text-gray-500 mt-6">
              Don't have an account? <Link to="/signup" className="text-primary font-bold hover:underline">Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

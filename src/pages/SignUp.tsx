import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Loader2, Mail, ShieldCheck, ArrowRight, Camera } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { COLLEGES, DEPARTMENTS, LEVELS } from '../constants';
import { cn } from '../lib/utils';

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Info, 2: Verification
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    college: '',
    department: '',
    level: '100 Level'
  });

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState('');

  // Username availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsUsernameValid(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const refined = username.startsWith('@') ? username : `@${username}`;
      const q = query(collection(db, 'users'), where('username', '==', refined));
      const snapshot = await getDocs(q);
      setIsUsernameValid(snapshot.empty);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUsernameValid) return;

    setLoading(true);
    try {
      // Create Firebase Auth User first
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // Send real verification link but also simulate a "code" for the UI request
      await sendEmailVerification(user);
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedCode(code);
      console.log("Simulated Verification Code:", code);
      alert(`[SIMULATION] Your verification code is: ${code}. (A real link was also sent to your email)`);
      
      setStep(2);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error starting sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.join('') !== simulatedCode) {
      alert("Invalid verification code.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      const refinedUsername = username.startsWith('@') ? username : `@${username}`;
      await updateProfile(user, { displayName: formData.fullName });

      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        username: refinedUsername,
        email: formData.email,
        college: formData.college,
        department: formData.department,
        level: formData.level,
        role: 'STUDENT',
        reputation: 0,
        friendListVisible: true,
        isOnline: true,
        createdAt: serverTimestamp(),
      });

      navigate('/feed');
    } catch (err) {
      console.error(err);
      alert('Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Sidebar */}
      <div className="hidden lg:flex bg-primary p-16 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <span className="text-white/40 font-medium">my</span>
            <span className="text-white font-serif font-black text-3xl uppercase tracking-tighter italic">lasued</span>
          </div>
          <div className="space-y-6">
            <h1 className="text-6xl font-serif font-black leading-tight">Professional campus networking, <span className="text-accent underline decoration-white/20">crafted for you.</span></h1>
            <p className="text-white/70 text-xl max-w-lg leading-relaxed">Join the central hub for learning, collaboration, and commerce at Lagos State University of Education.</p>
          </div>
        </div>
        <div className="relative z-10 pt-12 border-t border-white/10 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em]">
           <span>Est. 2024</span>
           <span className="text-accent italic">"We're Unique and Professional"</span>
        </div>
      </div>

      {/* Form Area */}
      <div className="p-8 md:p-16 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-2">
            <h2 className="text-4xl font-serif font-black text-primary">
              {step === 1 ? "Start your journey" : "Verify account"}
            </h2>
            <p className="text-gray-500 font-medium capitalize">
              {step === 1 ? "Fill in your details to join the professional student network." : "Input the 6-digit code sent to your email address."}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleInitialSubmit} className="space-y-6">
               <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">Full Name</label>
                <div className="relative group">
                  <input 
                    required
                    type="text" 
                    placeholder="Enter your full name"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({...formData, fullName: e.target.value});
                      if (!username) {
                        const suggested = e.target.value.toLowerCase().replace(/\s+/g, '_');
                        if (suggested) setUsername(`${suggested}`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">Username</label>
                  <div className="relative group">
                    <input 
                      required
                      type="text" 
                      placeholder="student_pro"
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {checkingUsername ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : 
                       isUsernameValid === true ? <Check className="w-4 h-4 text-green-500" /> :
                       isUsernameValid === false ? <X className="w-4 h-4 text-red-500" /> : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">Email</label>
                  <input 
                    required
                    type="email" 
                    placeholder="name@email.com"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">College</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none appearance-none"
                    value={formData.college}
                    onChange={(e) => setFormData({...formData, college: e.target.value, department: ''})}
                  >
                    <option value="">Select College</option>
                    {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">Department</label>
                    <select 
                      required
                      disabled={!formData.college}
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none appearance-none disabled:opacity-40"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="">Select Dept</option>
                      {formData.college && (DEPARTMENTS as any)[formData.college]?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">Level</label>
                    <select 
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none appearance-none"
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value})}
                    >
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest px-1">Password</label>
                <input 
                  required
                  type="password" 
                  placeholder="Create a strong password"
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 focus:bg-white transition-all outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                disabled={loading || isUsernameValid === false}
                type="submit" 
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                  <>Continue <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95">
               <div className="flex justify-between gap-3">
                 {otp.map((digit, i) => (
                   <input
                     key={i}
                     id={`otp-${i}`}
                     type="text"
                     maxLength={1}
                     className="w-full h-14 bg-gray-50 text-center text-xl font-black rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none"
                     value={digit}
                     onChange={(e) => handleOtpChange(i, e.target.value)}
                   />
                 ))}
               </div>

               <button 
                 onClick={handleVerify}
                 disabled={loading || otp.some(d => !d)}
                 className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
               >
                 {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                   <>Complete Registration <ShieldCheck className="w-5 h-5" /></>
                 )}
               </button>

               <div className="text-center space-y-4">
                  <p className="text-xs text-gray-400 font-medium italic">Didn't get the code? Check your spam folder or </p>
                  <button onClick={() => setStep(1)} className="text-xs font-black text-primary uppercase tracking-widest hover:underline px-4 py-2 bg-primary/5 rounded-full">Resend Code</button>
               </div>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm font-medium">
            Already have an account? <Link to="/signin" className="text-primary font-black hover:underline px-2">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useAuth } from '@/src/lib/authContext';
import MainLayout from '@/src/components/layout/MainLayout';
import { Search, Send, User, Loader2, ShoppingBag } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Messages() {
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('recipient');
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch conversations where user is sender or receiver
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // In a real app, I'd group these into conversations. 
      // For this prototype, I'll simulate a simple list of recent DMs.
      setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || !activeChat) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: input,
        senderId: user.uid,
        receiverId: activeChat.id,
        participants: [user.uid, activeChat.id],
        createdAt: serverTimestamp(),
      });
      setInput('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100vh-140px)] flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary/20 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
             {loading ? (
               <div className="p-8 text-center text-gray-400 italic">Loading conversations...</div>
             ) : (
               <div className="space-y-1 p-2">
                 {/* Mock active chat if recipientId is provided */}
                 {recipientId && (
                   <button 
                    onClick={() => setActiveChat({ id: recipientId, fullName: 'New Conversation' })}
                    className="w-full p-3 rounded-2xl bg-primary-light text-left"
                   >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold">NP</div>
                        <div>
                          <p className="font-bold text-sm text-primary">New Conversation</p>
                          <p className="text-xs text-primary/60">Start chatting now</p>
                        </div>
                     </div>
                   </button>
                 )}
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-300 px-4 py-2">Recent Chats</p>
                 <div className="p-8 text-center text-gray-400 text-xs italic">
                    Your recent conversations will appear here.
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          {activeChat ? (
            <>
              <div className="p-4 bg-white border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                    {activeChat.fullName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{activeChat.fullName}</h4>
                    <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Online</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <div className="text-center py-12">
                   <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                     <User className="w-8 h-8" />
                   </div>
                   <h3 className="font-serif text-xl text-primary font-bold">Start your professional dialogue</h3>
                   <p className="text-sm text-gray-400">Messages are secure and private within the LASUED network.</p>
                 </div>
              </div>
              <div className="p-4 bg-white border-t border-gray-50">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                  <input 
                    type="text" 
                    placeholder="Write a message..."
                    className="flex-1 bg-transparent border-none outline-none px-2 text-sm"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="bg-primary text-white p-2 rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
               <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
               <p className="font-serif italic text-lg">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

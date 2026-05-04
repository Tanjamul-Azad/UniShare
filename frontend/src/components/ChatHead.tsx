import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { AnimatePresence, motion } from 'motion/react';

export default function ChatHead() {
  const { unreadThreadCount } = useSocket();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  // Show whenever unreadThreadCount > 0
  useEffect(() => {
    if (unreadThreadCount > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [unreadThreadCount]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3"
        >
          <div className="bg-white px-4 py-2.5 rounded-2xl shadow-xl border border-gray-100 text-sm font-medium text-gray-800 flex items-center gap-3 animate-in slide-in-from-bottom-2">
            <span>New message arrived!</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
              }} 
              className="p-1 -mr-1 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              navigate('/inbox');
            }}
            className="relative w-14 h-14 bg-indigo-600 rounded-full shadow-xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 hover:scale-105 hover:-translate-y-1 transition-all text-white group"
          >
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {unreadThreadCount > 9 ? '9+' : unreadThreadCount}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

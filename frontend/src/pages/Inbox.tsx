import { useNavigate, useSearchParams } from 'react-router-dom';
import { FormEvent, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Search, Send, Smile, Trash2, PencilLine, Reply, X, Check, CheckCheck, ArrowLeft,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VerificationModal from '../components/VerificationModal';

type ConversationPreview = {
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastTimestamp: string;
  unread: boolean;
};

const EMOJI_QUICK = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

function avatarColor(name: string) {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function relTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function fullTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Inbox() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParticipantId = searchParams.get('participant');
  const { 
    messages, 
    sendMessage, 
    editMessage, 
    deleteMessage, 
    reactToMessage, 
    sendTyping, 
    typingByUserId, 
    onlineUsers, 
    markThreadRead 
  } = useSocket();

  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [emojiTargetId, setEmojiTargetId] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isVerified = user?.verificationStatus === 'verified' || user?.isVerified;

  // Sync query param to activeParticipantId
  useEffect(() => {
    if (queryParticipantId) {
      setActiveParticipantId(queryParticipantId);
    }
  }, [queryParticipantId]);

  const conversations = useMemo<ConversationPreview[]>(() => {
    if (!user) return [];
    const map = new Map<string, ConversationPreview>();
    messages.forEach((m) => {
      if (m.senderId !== user.id && m.receiverId !== user.id) return;
      const pid = m.senderId === user.id ? m.receiverId : m.senderId;
      const pname = m.senderId === user.id ? (m.receiverName ?? 'User') : m.senderName;
      const existing = map.get(pid);
      if (!existing || new Date(m.timestamp) > new Date(existing.lastTimestamp)) {
        map.set(pid, {
          participantId: pid,
          participantName: pname ?? 'User',
          lastMessage: m.deletedAt ? '🚫 Deleted message' : m.content,
          lastTimestamp: m.timestamp,
          unread: m.receiverId === user.id && !m.read,
        });
      }
    });
    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
    if (!convSearch.trim()) return sorted;
    const q = convSearch.toLowerCase();
    return sorted.filter((c) => c.participantName.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
  }, [messages, user, convSearch]);

  const selectedId = activeParticipantId ?? conversations[0]?.participantId ?? null;

  const allThread = useMemo(() => {
    if (!user || !selectedId) return [];
    return messages
      .filter((m) => (m.senderId === user.id && m.receiverId === selectedId) || (m.senderId === selectedId && m.receiverId === user.id))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedId, user]);

  const threadMessages = useMemo(() => {
    if (!msgSearch.trim()) return allThread;
    const q = msgSearch.toLowerCase();
    return allThread.filter((m) => m.content.toLowerCase().includes(q));
  }, [allThread, msgSearch]);

  useEffect(() => {
    if (selectedId) markThreadRead(selectedId);
    return () => { if (selectedId) sendTyping(selectedId, false); };
  }, [selectedId, markThreadRead, sendTyping]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const target = event.target as Node | null;
      if (target && textarea.contains(target)) return;
      if (document.activeElement === textarea) {
        textarea.blur();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  useEffect(() => {
    if (!selectedId || !user) return;
    const lastMsg = allThread[allThread.length - 1];
    if (lastMsg && lastMsg.senderId === selectedId && lastMsg.receiverId === user.id && !lastMsg.read) {
      markThreadRead(selectedId);
    }
  }, [allThread, selectedId, user, markThreadRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allThread.length, selectedId]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }, []);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    if (!isVerified) {
      setShowVerificationModal(true);
      return;
    }
    if (editingId) {
      editMessage(editingId, draft.trim());
      setEditingId(null);
    } else {
      sendMessage(selectedId, draft.trim(), replyToId || undefined);
    }
    setDraft('');
    setReplyToId(null);
    sendTyping(selectedId, false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const isTyping = selectedId ? Boolean(typingByUserId[selectedId]) : false;
  const isOnline = selectedId ? onlineUsers.includes(selectedId) : false;
  const replyMsg = replyToId ? allThread.find((m) => m.id === replyToId) : null;
  const selectedConv = conversations.find((c) => c.participantId === selectedId);
  const lastThreadMsgId = allThread[allThread.length - 1]?.id;

  const getReactionSummary = (reactions: { userId: string; emoji: string }[] = []) => {
    const map = new Map<string, number>();
    reactions.forEach((r) => map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1));
    return Array.from(map.entries()).map(([emoji, count]) => ({ emoji, count }));
  };

  const extractUrl = (content: string) => {
    const match = content.match(/https?:\/\/[^\s]+/i);
    return match?.[0];
  };

  const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp)$/i.test(url);
  const isVideoUrl = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

  const renderMessageBody = (content: string, isMine: boolean) => {
    const url = extractUrl(content);
    if (!url) {
      return <p className="leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
    }

    const isOnlyUrl = content.trim() === url.trim();
    return (
      <div className="space-y-2">
        {!isOnlyUrl && <p className="leading-relaxed whitespace-pre-wrap break-words">{content}</p>}
        {isImageUrl(url) && (
          <img
            src={url}
            alt="Shared media"
            className="max-h-60 rounded-xl border border-gray-200 shadow-sm"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        {isVideoUrl(url) && (
          <video controls className="max-h-60 rounded-xl border border-gray-200 shadow-sm">
            <source src={url} />
          </video>
        )}
        {!isImageUrl(url) && !isVideoUrl(url) && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={`text-xs underline ${isMine ? 'text-indigo-100' : 'text-indigo-600'}`}
          >
            {url}
          </a>
        )}
      </div>
    );
  };

  return (
    <>
      <VerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)} 
      />
      <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm font-body">

        {/* ─── Sidebar ─── */}
        <aside className={`flex flex-col w-full md:w-80 lg:w-88 shrink-0 border-r border-gray-100 bg-white ${selectedId ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-1.5 -ml-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 font-display">Messages</h1>
              </div>
              {conversations.length > 0 && (
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                  {conversations.length}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full bg-gray-100 rounded-xl py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:bg-gray-50 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <MessageSquare className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[160px] leading-relaxed">
                  Contact sellers from listings to start chatting.
                </p>
              </div>
            ) : (
              <ul>
                {conversations.map((conv) => {
                  const isActive = conv.participantId === selectedId;
                  const color = avatarColor(conv.participantName);
                  return (
                    <li key={conv.participantId}>
                      <button
                        onClick={() => setActiveParticipantId(conv.participantId)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors relative ${
                          isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-indigo-600 rounded-r-full" />
                        )}
                        <div className={`relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${color}`}>
                          {conv.participantName.charAt(0).toUpperCase()}
                          {onlineUsers.includes(conv.participantId) && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className={`text-sm truncate pr-2 ${conv.unread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                              {conv.participantName}
                            </p>
                            <span className="text-[11px] text-gray-400 shrink-0">{relTime(conv.lastTimestamp)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className={`text-xs truncate flex-1 ${conv.unread ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                              {conv.lastMessage}
                            </p>
                            {conv.unread && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ─── Chat Panel ─── */}
        <div className={`flex-1 flex flex-col min-w-0 bg-gray-50/40 ${selectedId ? 'flex' : 'hidden md:flex'}`}>
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-5">
                <MessageSquare className="w-9 h-9 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-display">Your Messages</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-xs leading-relaxed">
                Select a conversation or contact a seller from the marketplace to start chatting.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
                <button
                  className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                  onClick={() => setActiveParticipantId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${avatarColor(selectedConv?.participantName ?? 'U')}`}>
                  {(selectedConv?.participantName ?? 'U').charAt(0).toUpperCase()}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{selectedConv?.participantName ?? 'User'}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-xs font-medium ${isTyping ? 'text-indigo-600' : isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {isTyping ? 'typing…' : isOnline ? 'Active now' : 'Offline'}
                    </span>
                    {isTyping && (
                      <span className="flex gap-0.5 ml-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={msgSearch}
                      onChange={(e) => setMsgSearch(e.target.value)}
                      placeholder="Search"
                      className="bg-gray-100 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-2 focus:ring-indigo-200 w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-1">
                {threadMessages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs font-medium text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                      Start of conversation
                    </span>
                  </div>
                )}

                {threadMessages.map((msg, idx) => {
                  const isMine = msg.senderId === user?.id;
                  const isDeleted = Boolean(msg.deletedAt);
                  const isLast = msg.id === lastThreadMsgId;
                  const nextMsg = threadMessages[idx + 1];
                  const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;
                  const showReceipt = isMine && msg.read;
                  const reactions = getReactionSummary(msg.reactions ?? []);
                  const isPending = msg.status === 'sending';
                  const isFailed = msg.status === 'failed';
                  const statusLabel = isFailed ? 'Failed' : isPending ? 'Sending' : msg.read ? 'Seen' : 'Sent';
                  const showStatusLabel = isMine && (isLast || isPending || isFailed);
                  const showStatusIcon = isMine && !isPending && !isFailed;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}
                      onMouseEnter={() => setHoveredMsgId(msg.id)}
                      onMouseLeave={() => { setHoveredMsgId(null); setEmojiTargetId(null); }}
                    >
                      {!isMine && (
                        <div className="w-8 shrink-0 mr-1.5 self-end">
                          {isLastInGroup && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(msg.senderName ?? 'U')}`}>
                              {(msg.senderName ?? 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {msg.replyToId && (
                          <div className={`mb-1 text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-600 max-w-full ${isMine ? 'self-end' : 'self-start'}`}>
                            <span className="font-semibold">{msg.replyToSenderName ?? 'User'}: </span>
                            <span className="line-clamp-1">{msg.replyToContent ?? 'Message'}</span>
                          </div>
                        )}

                        <div className="relative group/bubble">
                          <div
                            className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isMine
                                ? `bg-indigo-600 text-white ${isLastInGroup ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl'}`
                                : `bg-white text-gray-800 border border-gray-200 ${isLastInGroup ? 'rounded-2xl rounded-bl-sm' : 'rounded-2xl'}`
                            }`}
                          >
                            {isDeleted ? (
                              <span className={`italic text-xs ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                This message was deleted
                              </span>
                            ) : (
                              renderMessageBody(msg.content, isMine)
                            )}
                          </div>

                          {!isDeleted && hoveredMsgId === msg.id && (
                            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${isMine ? 'right-full mr-2' : 'left-full ml-2'}`}>
                              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1.5 shadow-md">
                                <button onClick={() => setReplyToId(msg.id)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="Reply">
                                  <Reply className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEmojiTargetId(emojiTargetId === msg.id ? null : msg.id)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="React">
                                  <Smile className="w-3.5 h-3.5" />
                                </button>
                                {isMine && (
                                  <>
                                    <button onClick={() => { setEditingId(msg.id); setDraft(msg.content); textareaRef.current?.focus(); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors" title="Edit">
                                      <PencilLine className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => deleteMessage(msg.id)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-rose-600 transition-colors" title="Delete">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {emojiTargetId === msg.id && (
                            <div className={`absolute bottom-full mb-2 ${isMine ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-2xl px-2 py-1.5 shadow-lg flex gap-1 z-10`}>
                              {EMOJI_QUICK.map((em) => (
                                <button key={em} onClick={() => { reactToMessage(msg.id, em); setEmojiTargetId(null); }} className="text-base hover:scale-125 transition-transform p-0.5">
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {reactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            {reactions.map((r) => (
                              <button key={r.emoji} onClick={() => reactToMessage(msg.id, r.emoji)} className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs shadow-sm hover:bg-gray-50 transition-colors">
                                {r.emoji} <span className="text-gray-600 font-medium">{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span>{fullTime(msg.timestamp)}</span>
                            {msg.editedAt && <span>· Edited</span>}
                            {showStatusLabel && (
                              <span className={isFailed ? 'text-rose-500' : 'text-gray-400'}>{statusLabel}</span>
                            )}
                            {showStatusIcon && (
                              showReceipt
                                ? <CheckCheck className="w-3 h-3 text-indigo-500" />
                                : <Check className="w-3 h-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="px-4 sm:px-5 py-4 border-t border-gray-200 bg-white">
                <AnimatePresence>
                  {(replyMsg || editingId) && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex items-center justify-between mb-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2"
                    >
                      <div className="text-xs text-indigo-700">
                        {editingId ? (
                          <span className="font-semibold">Editing message</span>
                        ) : (
                          <>
                            <span className="font-semibold">Replying to {replyMsg?.senderName ?? 'User'}:</span>{' '}
                            <span className="line-clamp-1 opacity-80">{replyMsg?.content}</span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => { setReplyToId(null); setEditingId(null); setDraft(''); }}
                        className="ml-3 p-1 rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSend} className="flex items-end gap-3">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm focus-within:ring-4 focus-within:ring-indigo-100/70 focus-within:border-indigo-300 transition-all">
                    <textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        autoResize();
                        if (selectedId) sendTyping(selectedId, e.target.value.length > 0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e as unknown as FormEvent);
                        }
                      }}
                      placeholder="Type a message…"
                      rows={1}
                      className="w-full bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 resize-none min-h-[20px] max-h-[120px] py-0"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

type ConversationPreview = {
  participantId: string;
  participantName: string;
  lastMessage: string;
  lastTimestamp: string;
};

export default function Inbox() {
  const { user } = useAuth();
  const { messages, sendMessage, markThreadRead } = useSocket();
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');

  const conversations = useMemo<ConversationPreview[]>(() => {
    if (!user) {
      return [];
    }

    const map = new Map<string, ConversationPreview>();

    messages.forEach((message) => {
      if (message.senderId !== user.id && message.receiverId !== user.id) {
        return;
      }

      const participantId = message.senderId === user.id ? message.receiverId : message.senderId;
      const participantName = message.senderId === user.id ? 'Marketplace Contact' : message.senderName;
      const existing = map.get(participantId);

      if (!existing || new Date(message.timestamp) > new Date(existing.lastTimestamp)) {
        map.set(participantId, {
          participantId,
          participantName,
          lastMessage: message.content,
          lastTimestamp: message.timestamp,
        });
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [messages, user]);

  const selectedConversationId = activeParticipantId || conversations[0]?.participantId || null;

  const threadMessages = useMemo(() => {
    if (!user || !selectedConversationId) {
      return [];
    }

    return messages
      .filter(
        (message) =>
          (message.senderId === user.id && message.receiverId === selectedConversationId) ||
          (message.senderId === selectedConversationId && message.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedConversationId, user]);

  useEffect(() => {
    if (selectedConversationId) {
      markThreadRead(selectedConversationId);
    }
  }, [markThreadRead, selectedConversationId]);

  const handleSendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedConversationId || !messageDraft.trim()) {
      return;
    }

    sendMessage(selectedConversationId, messageDraft.trim());
    setMessageDraft('');
  };

  return (
    <section className="relative isolate overflow-hidden py-10 sm:py-14 min-h-screen bg-slate-50/30">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_#fae8ff_0,_transparent_40%),radial-gradient(circle_at_bottom_right,_#e0f2fe_0,_transparent_45%)]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Inbox</h1>
          <p className="mt-2 text-slate-600">Chat with buyers, sellers, and group members in one place.</p>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr] items-start">
          {/* Sidebar */}
          <aside className="flex flex-col h-[600px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-5 bg-white flex justify-between items-center z-10 sticky top-0">
              <h2 className="text-base font-semibold text-slate-900">Messages</h2>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{conversations.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                    <MessageSquare className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">No messages yet</p>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-[200px]">
                    Connect with users from the marketplace or groups to start chatting.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {conversations.map((conversation) => {
                    const isActive = conversation.participantId === selectedConversationId;
                    return (
                      <li key={conversation.participantId}>
                        <button
                          onClick={() => setActiveParticipantId(conversation.participantId)}
                          className={`w-full px-5 py-4 text-left transition-all flex items-start gap-4 ${
                            isActive ? 'bg-indigo-50/60 relative' : 'hover:bg-slate-50'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-full" />
                          )}
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold text-lg shadow-sm border border-indigo-200/50">
                            {conversation.participantName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex justify-between items-baseline mb-1">
                              <p className={`text-sm font-semibold truncate pr-3 ${isActive ? 'text-indigo-950' : 'text-slate-900'}`}>
                                {conversation.participantName}
                              </p>
                              <span className={`text-[11px] whitespace-nowrap ${isActive ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                                {new Date(conversation.lastTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className={`truncate text-xs ${isActive ? 'text-indigo-800' : 'text-slate-500'}`}>
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Chat Window */}
          <div className="flex flex-col h-[600px] rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
            {!selectedConversationId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                <div className="w-20 h-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-5">
                  <MessageSquare className="h-10 w-10 text-indigo-300" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Your Messages</h3>
                <p className="mt-3 text-sm text-slate-500 max-w-sm leading-relaxed">
                  Select a conversation from the sidebar to view messages, or explore the marketplace to contact sellers directly.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-4 bg-white/95 backdrop-blur-sm shadow-sm z-10 sticky top-0">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base shadow-sm border border-indigo-200/50">
                    {conversations.find(c => c.participantId === selectedConversationId)?.participantName.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {conversations.find(c => c.participantId === selectedConversationId)?.participantName || 'User'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"></div>
                      <span className="text-[12px] font-medium text-slate-500">Active now</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-6 bg-slate-50/50 scroll-smooth">
                  {threadMessages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                       <span className="text-xs font-medium text-slate-400 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm mt-auto mb-4">
                         Start of conversation
                       </span>
                    </div>
                  ) : (
                    threadMessages.map((message) => {
                      const isMine = message.senderId === user?.id;
                      return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            <div
                              className={`rounded-2xl px-5 py-3 text-[15px] shadow-sm ${
                                isMine
                                  ? 'rounded-tr-sm bg-indigo-600 text-white'
                                  : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <span className="mt-1.5 text-[10px] text-slate-400 font-medium px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-5 bg-white">
                  <div className="flex items-end gap-3 relative">
                    <textarea
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as unknown as FormEvent);
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm text-slate-800 outline-none transition-all min-h-[52px] max-h-[120px] focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50/50"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={!messageDraft.trim()}
                      className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                    >
                      <Send className="h-5 w-5 ml-1" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

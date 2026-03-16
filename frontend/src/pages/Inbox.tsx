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
    <section className="relative isolate overflow-hidden py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_#fae8ff_0,_transparent_40%),radial-gradient(circle_at_bottom_right,_#e0f2fe_0,_transparent_45%)]" />

      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Inbox</h1>
          <p className="mt-2 text-slate-600">Chat with buyers, sellers, and group members in one place.</p>
        </motion.div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">Recent Conversations</p>
            </div>

            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No conversations yet</p>
              </div>
            ) : (
              <ul className="max-h-[540px] overflow-y-auto">
                {conversations.map((conversation) => {
                  const isActive = conversation.participantId === selectedConversationId;
                  return (
                    <li key={conversation.participantId}>
                      <button
                        onClick={() => setActiveParticipantId(conversation.participantId)}
                        className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                          isActive ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {conversation.participantName}
                        </p>
                        <p className={`mt-1 truncate text-xs ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                          {conversation.lastMessage}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="flex min-h-[520px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {selectedConversationId ? 'Conversation' : 'Select a chat'}
              </p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {threadMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center">
                  <div>
                    <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">Open a conversation to view messages.</p>
                  </div>
                </div>
              ) : (
                threadMessages.map((message) => {
                  const isMine = message.senderId === user?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMine
                            ? 'rounded-br-sm bg-slate-900 text-white'
                            : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-800'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`mt-1 text-[10px] ${isMine ? 'text-slate-300' : 'text-slate-400'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder={selectedConversationId ? 'Type your message...' : 'Choose a conversation first'}
                  disabled={!selectedConversationId}
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-slate-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!selectedConversationId || !messageDraft.trim()}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

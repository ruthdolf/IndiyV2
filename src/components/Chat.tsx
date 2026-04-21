import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Paperclip, MoreVertical, Search, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc 
} from '../firebase';
import { Message, Conversation, sendMessage } from '../services/messagingService';
import { format } from 'date-fns';

export const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const stateActiveId = location.state?.activeId;
  
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(stateActiveId || null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for conversations
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      setConversations(convs);
      
      // If we have an activeId from state, stay on it. 
      // Otherwise, pick the first one if we don't have an active selection yet.
      if (convs.length > 0 && !activeConversationId && !stateActiveId) {
        setActiveConversationId(convs[0].id);
      } else if (stateActiveId) {
        setActiveConversationId(stateActiveId);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for messages
  useEffect(() => {
    if (!activeConversationId) return;

    setLoadingMessages(true);
    const q = query(
      collection(db, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeConversationId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !activeConversationId || !user) return;

    const textToSend = message;
    setMessage('');

    try {
      await sendMessage(activeConversationId, user.uid, textToSend);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    if (!user) return null;
    const otherId = conv.participants.find(id => id !== user.uid);
    return otherId ? conv.participantDetails[otherId] : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-128px)]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-128px)] gap-6">
      {/* Contact List */}
      <Card className="w-80 flex flex-col">
        <div className="p-4 border-b border-border-subtle">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand/50"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    "p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-border-subtle/50",
                    activeConversationId === conv.id ? "bg-brand/10" : "hover:bg-white/5"
                  )}
                >
                  <div className="relative">
                    <img
                      src={other?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.displayName}`}
                      alt={other?.displayName}
                      className="w-12 h-12 rounded-full border border-border-subtle object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm truncate">{other?.displayName}</h4>
                      <span className="text-[10px] text-text-muted">
                        {conv.updatedAt?.seconds ? format(conv.updatedAt.seconds * 1000, 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {conv.lastMessage?.senderId === user?.uid ? 'You: ' : ''}
                      {conv.lastMessage?.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-grow flex flex-col overflow-hidden">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-surface z-10">
              <div className="flex items-center gap-3">
                <img
                  src={getOtherParticipant(activeConversation)?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOtherParticipant(activeConversation)?.displayName}`}
                  alt={getOtherParticipant(activeConversation)?.displayName}
                  className="w-10 h-10 rounded-full border border-border-subtle object-cover"
                />
                <div>
                  <h4 className="font-bold text-sm">{getOtherParticipant(activeConversation)?.displayName}</h4>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Online</p>
                </div>
              </div>
              <button className="p-2 text-text-muted hover:text-text-primary transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-90">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-brand animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-text-muted text-sm italic">
                  Start your conversation...
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm shadow-lg",
                        msg.senderId === user?.uid
                          ? "bg-brand text-white rounded-tr-none"
                          : "bg-bg-elevated text-text-primary border border-border-subtle rounded-tl-none"
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-text-muted mt-1 px-1">
                      {msg.createdAt?.seconds ? format(msg.createdAt.seconds * 1000, 'HH:mm') : ''}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-subtle bg-bg-surface z-10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" className="p-2 text-text-muted hover:text-text-primary transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-grow relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-bg-elevated border border-border-subtle rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand/50"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="p-3 bg-brand hover:bg-brand-hover text-white rounded-xl transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow text-text-muted space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
              <Send className="w-8 h-8 text-brand" />
            </div>
            <p className="text-sm font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </Card>
    </div>
  );
};

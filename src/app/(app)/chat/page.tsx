
'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Hash, 
  Search, 
  Send, 
  Plus, 
  Ship, 
  User, 
  Clock, 
  Paperclip,
  Calendar,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import type { Conversation, Message, User as UserType } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { user, userProfile } = useCurrentUser();
  const firestore = useFirestore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Fetch Conversations
  const convQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'conversations'), orderBy('updatedAt', 'desc'));
  }, [firestore]);
  const { data: conversations, isLoading: convsLoading } = useCollection<Conversation>(convQuery);

  // Fetch Messages for selected chat
  const msgQuery = useMemoFirebase(() => {
    if (!firestore || !selectedChat) return null;
    return query(
      collection(firestore, `conversations/${selectedChat}/messages`),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [firestore, selectedChat]);
  const { data: messages, isLoading: msgsLoading } = useCollection<Message>(msgQuery);

  // Active Chat Info
  const activeChat = conversations?.find(c => c.id === selectedChat);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || !user || !firestore) return;

    const text = message;
    setMessage('');

    try {
      await addDoc(collection(firestore, `conversations/${selectedChat}/messages`), {
        text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        isSystem: false
      });
    } catch (e) {
      console.error("Chat send failed", e);
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] top-20 bg-slate-50 flex overflow-hidden">
      {/* LEFT - CHAT LIST */}
      <div className="w-80 border-r bg-white flex flex-col shrink-0">
        <div className="p-6 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Workspace</h2>
            <Button variant="ghost" size="icon" className="rounded-xl"><Plus className="size-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <Input placeholder="Jump to..." className="pl-10 bg-slate-50 border-none rounded-xl h-10" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            <p className="px-3 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">Channels</p>
            {convsLoading ? (
              <div className="p-4 space-y-4"><div className="h-8 bg-slate-100 rounded-lg animate-pulse" /></div>
            ) : conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv.id!)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                  selectedChat === conv.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                {conv.type === 'channel' ? <Hash className="size-4 shrink-0 opacity-60" /> : <Ship className="size-4 shrink-0 opacity-60" />}
                <span className="text-sm font-bold truncate flex-1 text-left">{conv.title}</span>
                {conv.lastMessage && selectedChat !== conv.id && (
                  <div className="size-2 rounded-full bg-indigo-500" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* CENTER - CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
            <div className="size-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
              <MessageSquare className="size-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Your Workspace</h3>
            <p className="text-slate-500 mt-2 max-w-sm">Collaborate with your team on shipments, leads, and tasks in real-time.</p>
          </div>
        ) : (
          <>
            <div className="h-20 border-b flex items-center px-8 justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  {activeChat?.type === 'channel' ? <Hash className="size-5" /> : <Ship className="size-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{activeChat?.title}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Internal Discussion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl"><Calendar className="mr-2 size-4" /> Schedule</Button>
                <Button variant="outline" size="icon" className="rounded-xl"><Search className="size-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {messages?.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                  
                  return (
                    <div key={msg.id} className={cn("flex gap-4 group", isMe ? "flex-row-reverse" : "flex-row")}>
                      <div className="shrink-0 pt-1">
                        {showAvatar ? (
                          <Avatar className="size-10 rounded-2xl border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">ST</AvatarFallback>
                          </Avatar>
                        ) : <div className="size-10" />}
                      </div>
                      <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                        {showAvatar && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className="text-xs font-bold text-slate-900">{isMe ? "You" : "Staff"}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {msg.createdAt ? format(msg.createdAt.toDate(), 'p') : '...'}
                            </span>
                          </div>
                        )}
                        <div className={cn(
                          "px-5 py-3 rounded-3xl text-sm font-medium shadow-sm transition-all",
                          isMe 
                            ? "bg-indigo-600 text-white rounded-tr-none" 
                            : "bg-slate-100 text-slate-800 rounded-tl-none group-hover:bg-slate-200"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="p-8 shrink-0">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-4 p-4 bg-slate-50 rounded-[32px] border border-slate-200 shadow-sm focus-within:border-indigo-300 focus-within:bg-white transition-all">
                <Button type="button" variant="ghost" size="icon" className="rounded-full shrink-0"><Paperclip className="size-5 text-slate-400" /></Button>
                <Input 
                  placeholder={`Message ${activeChat?.title}...`} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-none bg-transparent shadow-none focus-visible:ring-0 text-base"
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" disabled={!message.trim()}>
                  <Send className="size-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* RIGHT - CONTEXT BAR */}
      {selectedChat && (
        <div className="w-80 border-l bg-white hidden xl:flex flex-col shrink-0">
          <div className="p-6 border-b">
            <h4 className="font-bold text-slate-900">Conversation Details</h4>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Context Summary</p>
                <Card className="bg-slate-50 border-none">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white shadow-sm text-indigo-600"><CheckCircle2 className="size-4" /></div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Next Task Due</p>
                      <p className="text-[10px] text-slate-500">Document Review (Tomorrow)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Files</p>
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-bold p-0 h-auto">View All</Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Participants</p>
                <div className="space-y-3">
                  {['Admin', 'Sales Executive', 'Ops Head'].map(name => (
                    <div key={name} className="flex items-center gap-3">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">{name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-slate-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

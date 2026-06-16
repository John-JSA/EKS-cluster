import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

export default function ChatBox({ rideId, currentUser, currentRole }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!rideId) return;
    socket.emit('join_ride_chat', { rideId });

    function onMessage(msg) {
      setMessages(prev => [...prev, msg]);
      if (!open && msg.senderId !== currentUser.id) setUnread(n => n + 1);
    }
    socket.on('chat_message', onMessage);
    return () => {
      socket.off('chat_message', onMessage);
      socket.emit('leave_ride_chat', { rideId });
    };
  }, [rideId, currentUser.id, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat_message', {
      rideId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentRole,
      text: text.trim(),
    });
    setText('');
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 mb-3 flex flex-col" style={{ height: 380 }}>
          {/* Header */}
          <div className="bg-green-500 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} />
              <span className="font-semibold text-sm">Ride Chat</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg leading-none">&times;</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-xs mt-8">
                No messages yet. Say hello to your {currentRole === 'passenger' ? 'driver' : 'passenger'}!
              </p>
            )}
            {messages.map(msg => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                    isMe ? 'bg-green-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-0.5 capitalize opacity-70">{msg.senderRole}</p>
                    )}
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 opacity-60 text-right`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} className="flex gap-2 px-3 py-3 border-t border-gray-100">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
            />
            <button type="submit" disabled={!text.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white rounded-xl px-3 flex items-center">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* FAB toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-green-500 hover:bg-green-600 active:scale-95 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all relative"
      >
        <MessageCircle size={22} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const messagesEndRef = useRef(null);
  
  // Track processed tool calls to avoid double-dispatching to cart
  const processedToolCalls = useRef(new Set());

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: 'http://localhost:5000/api/agent/chat',
    body: {
      sessionId: user?.phone || 'anonymous-session',
      phone: user?.phone
    }
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process server tool results for side-effects (e.g. adding to cart)
  useEffect(() => {
    messages.forEach(m => {
      if (m.toolInvocations) {
        m.toolInvocations.forEach(toolInvocation => {
          if (toolInvocation.state === 'result' && !processedToolCalls.current.has(toolInvocation.toolCallId)) {
            processedToolCalls.current.add(toolInvocation.toolCallId);
            
            const result = toolInvocation.result;
            if (toolInvocation.toolName === 'addToCart' && result.success) {
               const item = result.addedItem;
               addToCart({
                 foodItem: item._id,
                 name: item.name,
                 price: item.price,
                 image: item.image,
                 quantity: item.quantity
               });
               addToast('success', result.message);
            } else if (toolInvocation.toolName === 'reorderItems' && result.success) {
               const items = result.reorderedItems;
               items.forEach(item => {
                 addToCart({
                   foodItem: item.foodItem,
                   name: item.name,
                   price: item.price,
                   image: item.image,
                   quantity: item.quantity
                 });
               });
               addToast('success', result.message);
            }
          }
        });
      }
    });
  }, [messages, addToCart, addToast]);
  return (
    <div className="fixed bottom-24 right-5 z-50 hidden md:flex flex-col items-end">
      {isOpen && (
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-2xl rounded-3xl w-[350px] max-h-[500px] flex flex-col mb-4 overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-4 flex justify-between items-center shadow-md">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <span className="text-xl">🤖</span> Digital Nanban
              </h3>
              <p className="text-xs text-orange-100">Your Master AI Ordering Agent</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-orange-100 transition bg-white/20 p-1.5 rounded-full"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-10">
                <p className="text-3xl mb-2">👋</p>
                <p>Hi! I'm Digital Nanban. How can I help you with your order today?</p>
                <div className="mt-4 flex flex-col gap-2 px-4">
                  <span className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm text-xs text-gray-600 dark:text-gray-300">"What do you have for starters?"</span>
                  <span className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm text-xs text-gray-600 dark:text-gray-300">"Suggest a veg meal under ₹200"</span>
                  <span className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm text-xs text-gray-600 dark:text-gray-300">"Reorder my last meal"</span>
                </div>
              </div>
            )}
            
            {messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.content && (
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-orange-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm'
                  }`}>
                    {m.content}
                  </div>
                )}
                
                {m.toolInvocations?.map(toolInvocation => (
                  <div key={toolInvocation.toolCallId} className="mt-2 text-xs">
                    {toolInvocation.state === 'call' ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full animate-pulse">
                        <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"/></svg>
                        Calling {toolInvocation.toolName}...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2 rounded-xl shadow-sm">
                        <span className="font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          {toolInvocation.toolName} complete
                        </span>
                        {toolInvocation.toolName === 'addToCart' && toolInvocation.result?.success && (
                          <span className="text-[10px]">Added to your cart ✅</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start">
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1 text-gray-400">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 items-center relative z-10">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask Digital Nanban..."
              className="flex-1 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input || !input.trim()}
              className="bg-orange-600 text-white w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700 transition shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center relative group"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-orange-500 border-2 border-white dark:border-gray-900"></span>
            </span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M9 10h.01M15 10h.01M12 10h.01"/>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

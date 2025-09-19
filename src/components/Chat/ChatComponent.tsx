'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Send, Bot, User, AlertCircle, Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ChatComponentProps {
  sessionId: string;
  token?: string;
  className?: string;
}

export default function ChatComponent({ sessionId, token, className = '' }: ChatComponentProps) {
  const { state, sendMessage, startTyping, stopTyping, connectToSession } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize chat connection
  useEffect(() => {
    if (sessionId && token && !isInitialized) {
      connectToSession(sessionId, token);
      setIsInitialized(true);
    }
  }, [sessionId, token, connectToSession, isInitialized]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isWaitingForResponse]);

  // Focus input when connected and not busy
  useEffect(() => {
    if (state.isConnected && !state.isWaitingForResponse && !state.isTypingResponse && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.isConnected, state.isWaitingForResponse, state.isTypingResponse]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputMessage(value);

    // Handle typing indicators
    if (value.trim()) {
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1 second of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    } else {
      stopTyping();
    }
  };

  const handleSendMessage = () => {
    const message = inputMessage.trim();
    if (!message || !state.isConnected || state.isWaitingForResponse || state.isTypingResponse) return;

    stopTyping();
    sendMessage(message);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isInputDisabled = !state.isConnected || state.isWaitingForResponse || state.isTypingResponse;

  return (
    <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          {state.isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">Disconnected</span>
            </>
          )}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{state.error}</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        {state.messages.length === 0 && !state.isWaitingForResponse ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
            <Bot className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Welcome to AI Assistant</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Ask me anything! I can help you with questions, writing, analysis, coding, and much more.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {state.messages.map((message) => (
              <div
                key={message.id}
                className={`w-full py-6 px-6 ${
                  message.sender === 'user' 
                    ? 'bg-white' 
                    : 'bg-gray-50/50'
                }`}
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {message.sender === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {message.metadata?.confidence_score && (
                          <span className="text-xs text-gray-400">
                            • Confidence: {(message.metadata.confidence_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      
                      <div className={`prose prose-sm max-w-none ${
                        message.sender === 'user' 
                          ? 'text-gray-900' 
                          : 'text-gray-800'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* AI Waiting/Loading Indicator */}
            {state.isWaitingForResponse && (
              <div className="w-full py-6 px-6 bg-gray-50/50">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">AI Assistant</span>
                      </div>
                      <div className="flex items-center space-x-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        <span className="text-sm text-gray-600 animate-pulse">
                          {state.currentLoadingMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Regular Typing Indicator (for other users) */}
            {state.isTyping && !state.isWaitingForResponse && (
              <div className="w-full py-6 px-6 bg-gray-50/50">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">AI Assistant</span>
                      </div>
                      <div className="flex space-x-1 py-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        {/* Status indicator when AI is processing */}
        {(state.isWaitingForResponse || state.isTypingResponse) && (
          <div className="px-6 py-2 bg-gray-50/50 border-b border-gray-100">
            <div className="max-w-4xl mx-auto flex items-center space-x-2 text-sm text-gray-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>
                {state.isWaitingForResponse ? 'AI is processing your message...' : 'AI is responding...'}
              </span>
            </div>
          </div>
        )}
        
        <div className="px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              {/* User Avatar */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              
              {/* Input Container */}
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      !state.isConnected 
                        ? "Connecting..." 
                        : isInputDisabled 
                          ? "AI is responding..." 
                          : "Message AI Assistant..."
                    }
                    disabled={isInputDisabled}
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 resize-none min-h-[48px] max-h-[150px]"
                    style={{ minHeight: '48px' }}
                  />
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={isInputDisabled || !inputMessage.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {state.isWaitingForResponse || state.isTypingResponse ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {/* Helper Text */}
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  {inputMessage.length > 0 && (
                    <span>{inputMessage.length} characters</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
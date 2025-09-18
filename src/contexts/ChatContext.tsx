'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { ChatService, Message, ChatEvents } from '@/services/chatService';

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  error: string | null;
  currentSessionId: string | null;
  isWaitingForResponse: boolean;
  isTypingResponse: boolean;
  currentLoadingMessage: string;
}

type ChatAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'RESET_CHAT' }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'SET_WAITING_FOR_RESPONSE'; payload: boolean }
  | { type: 'SET_TYPING_RESPONSE'; payload: boolean }
  | { type: 'SET_LOADING_MESSAGE'; payload: string }
  | { type: 'UPDATE_TYPING_MESSAGE'; payload: { id: string; content: string } };

const initialState: ChatState = {
  messages: [],
  isConnected: false,
  isTyping: false,
  error: null,
  currentSessionId: null,
  isWaitingForResponse: false,
  isTypingResponse: false,
  currentLoadingMessage: '',
};

const loadingMessages = [
  "🤔 AI is thinking...",
  "🧠 AI is analyzing your response...",
  "✨ Generating response...",
  "💡 Processing your request...",
  "🔍 Searching for the best answer...",
  "⚡ Almost ready..."
];

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload, error: action.payload ? null : state.error };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_SESSION_ID':
      return { ...state, currentSessionId: action.payload };
    case 'RESET_CHAT':
      return { ...initialState };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_WAITING_FOR_RESPONSE':
      return { ...state, isWaitingForResponse: action.payload };
    case 'SET_TYPING_RESPONSE':
      return { ...state, isTypingResponse: action.payload };
    case 'SET_LOADING_MESSAGE':
      return { ...state, currentLoadingMessage: action.payload };
    case 'UPDATE_TYPING_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        )
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  sendMessage: (message: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
  connectToSession: (sessionId: string, token: string) => Promise<void>;
  disconnect: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const chatService = useRef<ChatService | null>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cycling loading messages
  const startLoadingMessages = () => {
    let messageIndex = 0;
    dispatch({ type: 'SET_LOADING_MESSAGE', payload: loadingMessages[0] });
    
    loadingIntervalRef.current = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      dispatch({ type: 'SET_LOADING_MESSAGE', payload: loadingMessages[messageIndex] });
    }, 2000); 
  };

  const stopLoadingMessages = () => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  };

  // Typewriter effect
  const typewriterEffect = (message: Message, fullContent: string) => {
    dispatch({ type: 'SET_TYPING_RESPONSE', payload: true });
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      if (currentIndex < fullContent.length) {
        const currentContent = fullContent.slice(0, currentIndex + 1);
        dispatch({ 
          type: 'UPDATE_TYPING_MESSAGE', 
          payload: { id: message.id, content: currentContent }
        });
        currentIndex++;
        typewriterTimeoutRef.current = setTimeout(typeNextCharacter, 5); // 5ms per character
      } else {
        dispatch({ type: 'SET_TYPING_RESPONSE', payload: false });
      }
    };

    typeNextCharacter();
  };

  const chatEvents: ChatEvents = {
    onMessage: (message: Message) => {
      // Stop loading state
      dispatch({ type: 'SET_WAITING_FOR_RESPONSE', payload: false });
      stopLoadingMessages();

      if (message.sender === 'user' || message.sender === 'assistant') {
        // Add empty message first, then start typewriter effect
        const emptyMessage: Message = {
          ...message,
          content: ''
        };
        dispatch({ type: 'ADD_MESSAGE', payload: emptyMessage });
        
        // Start typewriter effect
        setTimeout(() => {
          typewriterEffect(emptyMessage, message.content);
        }, 100);
      } else {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
      }
    },
    onTyping: (isTyping: boolean) => {
      dispatch({ type: 'SET_TYPING', payload: isTyping });
    },
    onConnect: () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
    },
    onDisconnect: () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
    },
    onError: (error: string) => {
      dispatch({ type: 'SET_ERROR', payload: error });
      dispatch({ type: 'SET_WAITING_FOR_RESPONSE', payload: false });
      dispatch({ type: 'SET_TYPING_RESPONSE', payload: false });
      stopLoadingMessages();
    },
  };

  const sendMessage = (message: string) => {
    if (!chatService.current || !state.isConnected) {
      dispatch({ type: 'SET_ERROR', payload: 'Not connected to chat service' });
      return;
    }

    try {
      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // Start loading state
      dispatch({ type: 'SET_WAITING_FOR_RESPONSE', payload: true });
      startLoadingMessages();

      // Send via WebSocket
      chatService.current.sendMessage(message);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      dispatch({ type: 'SET_WAITING_FOR_RESPONSE', payload: false });
      stopLoadingMessages();
    }
  };

  const startTyping = () => {
    if (chatService.current && state.isConnected) {
      chatService.current.startTyping();
    }
  };

  const stopTyping = () => {
    if (chatService.current && state.isConnected) {
      chatService.current.stopTyping();
    }
  };

  const connectToSession = async (sessionId: string, token: string) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });

      // Disconnect existing connection if any
      if (chatService.current) {
        chatService.current.disconnect();
      }

      // Create new chat service
      chatService.current = new ChatService(token);

      // Connect to WebSocket
      await chatService.current.connect(chatEvents);

      // Join the session
      chatService.current.joinSession(sessionId);

    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to connect to chat';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const disconnect = () => {
    if (chatService.current) {
      chatService.current.disconnect();
      chatService.current = null;
    }
    
    // Clean up intervals and timeouts
    stopLoadingMessages();
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
    }
    
    dispatch({ type: 'RESET_CHAT' });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatService.current) {
        chatService.current.disconnect();
      }
      stopLoadingMessages();
      if (typewriterTimeoutRef.current) {
        clearTimeout(typewriterTimeoutRef.current);
      }
    };
  }, []);

  const contextValue: ChatContextType = {
    state,
    sendMessage,
    startTyping,
    stopTyping,
    connectToSession,
    disconnect,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
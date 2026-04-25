'use client';

import { createContext, useContext } from 'react';
import type { Step } from '@/lib/types';

interface ChatContextType {
  sendMessage: (text: string, step: Step) => Promise<void>;
  isLoading: boolean;
}

export const ChatContext = createContext<ChatContextType>({
  sendMessage: async () => {},
  isLoading: false,
});

export const useChatContext = () => useContext(ChatContext);

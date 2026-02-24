import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * CursorType registry:
 * - 'default'      → 24px dot with mix-blend-mode difference
 * - 'view-project' → 80px circle with "VIEW" label
 * - 'media'        → 120px circle playing a muted looping video from cursorMedia
 */
export type CursorType = 'default' | 'view-project' | 'media';

interface CursorContextType {
  cursorType: CursorType;
  setCursorType: (type: CursorType) => void;
  /** URL of the video (or GIF) to play inside the media cursor. */
  cursorMedia: string | null;
  setCursorMedia: (url: string | null) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const CursorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cursorType, setCursorType] = useState<CursorType>('default');
  const [cursorMedia, setCursorMedia] = useState<string | null>(null);

  return (
    <CursorContext.Provider value={{ cursorType, setCursorType, cursorMedia, setCursorMedia }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (context === undefined) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};
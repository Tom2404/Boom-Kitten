import React, { createContext, useContext } from 'react';

const GameContext = createContext(null);

export function GameProvider({ value, children }) {
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
}

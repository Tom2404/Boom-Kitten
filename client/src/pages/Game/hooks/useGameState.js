import { useState, useCallback, useMemo } from 'react';

export function useGameState(initialUser = null) {
  const [publicGameState, setPublicGameState] = useState(null);
  const [privateHand, setPrivateHand] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [errorToast, setErrorToast] = useState('');

  const clearError = useCallback(() => setErrorToast(''), []);
  const showError = useCallback((msg) => setErrorToast(msg), []);

  const isMyTurn = useMemo(() => {
    if (!publicGameState || !initialUser) return false;
    const currentTurnPlayer = publicGameState.players?.[publicGameState.currentPlayerIndex];
    return currentTurnPlayer?.userId === initialUser.id || currentTurnPlayer?.userId === initialUser._id;
  }, [publicGameState, initialUser]);

  const toggleSelectCard = useCallback((cardId) => {
    setSelectedCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedCards([]), []);

  return {
    publicGameState,
    setPublicGameState,
    privateHand,
    setPrivateHand,
    selectedCards,
    setSelectedCards,
    toggleSelectCard,
    clearSelection,
    isMyTurn,
    errorToast,
    showError,
    clearError,
  };
}

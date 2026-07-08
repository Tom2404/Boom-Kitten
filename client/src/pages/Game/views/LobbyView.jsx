import React from 'react';
import { useGameContext } from '../GameContext.jsx';
import LobbyCreateRoomView from '../components/LobbyCreateRoomView.jsx';
import LobbyHomeView from '../components/LobbyHomeView.jsx';
export default function LobbyView() {
  const { roomState, isCreatingRoom } = useGameContext();
  if (!roomState) {
    if (isCreatingRoom) {
      return <LobbyCreateRoomView />;
    }
    return <LobbyHomeView />;
  }
  return null;
}

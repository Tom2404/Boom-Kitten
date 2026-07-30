import React from 'react';
import InteractionModals from './InteractionModals.jsx';
import StatusOverlays from './StatusOverlays.jsx';

export default function GameModals(props) {
  return (
    <>
      <InteractionModals {...props} />
      <StatusOverlays />
    </>
  );
}

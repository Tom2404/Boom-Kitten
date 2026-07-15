import React from 'react';

const toneClass = {
  turn: 'game-turn-banner--active',
  waiting: 'game-turn-banner--waiting',
  syncing: 'game-turn-banner--syncing',
};

export default function TurnBanner({ state }) {
  return (
    <section
      className={`game-turn-banner ${toneClass[state.tone] || toneClass.syncing}`}
      aria-labelledby="game-turn-title"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="min-w-0">
        <p className="game-turn-banner__eyebrow">{state.eyebrow}</p>
        <h2 id="game-turn-title" className="game-turn-banner__title">{state.title}</h2>
      </div>
      <p className="game-turn-banner__description">{state.description}</p>
      <span className="sr-only">{state.liveLabel}</span>
    </section>
  );
}

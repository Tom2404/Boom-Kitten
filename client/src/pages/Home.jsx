import React from 'react';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import Stats from '../components/Stats.jsx';
import WhyExplodingKittens from '../components/WhyExplodingKittens.jsx';
import HowToPlay from '../components/HowToPlay.jsx';
import DeckShowcase from '../components/DeckShowcase.jsx';
import CTAFinal from '../components/CTAFinal.jsx';
import Footer from '../components/Footer.jsx';

/**
 * Home page component - Rebuilding the entire landing page with Pop Art theme.
 * Imports and renders all sections in sequence.
 * 
 * @param {Object} props
 * @param {function} props.setPage - Router state setter from App.jsx
 * @param {boolean} props.isLoggedIn - User login status
 * @param {string} props.userRole - User role ('admin' or 'user')
 * @param {function} props.handleLogout - App-level logout handler
 */
export default function Home({ setPage, isLoggedIn, userRole, handleLogout }) {
  React.useEffect(() => {
    // Add custom styling class to HTML body (affects scrollbar, text selection, and base styles)
    document.body.classList.add('pop-art-theme');
    
    return () => {
      // Clean up when leaving the homepage
      document.body.classList.remove('pop-art-theme');
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-[var(--pop-cream)] text-[var(--pop-black)] font-pop-body flex flex-col antialiased">
      {/* 01. NAVBAR */}
      <Navbar 
        page="Home"
        setPage={setPage} 
        isLoggedIn={isLoggedIn} 
        userRole={userRole} 
        handleLogout={handleLogout} 
      />

      {/* 02. HERO */}
      <Hero setPage={setPage} />

      {/* 03. STATS */}
      <Stats />

      {/* 04. WHY */}
      <WhyExplodingKittens />

      {/* 05. HOW */}
      <HowToPlay />

      {/* 05.5. DECK SHOWCASE */}
      <DeckShowcase />

      {/* 07. CTA FINAL */}
      <CTAFinal setPage={setPage} />

      {/* 08. FOOTER */}
      <Footer setPage={setPage} />
    </div>
  );
}

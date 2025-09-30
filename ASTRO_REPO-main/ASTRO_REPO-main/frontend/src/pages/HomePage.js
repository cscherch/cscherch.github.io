import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import PlanetsSection from '../components/PlanetsSection';
import TimelineSection from '../components/TimelineSection';
import InstrumentsSection from '../components/InstrumentsSection';
import GallerySection from '../components/GallerySection';
import NewsSection from '../components/NewsSection';
import ExoplanetsSection from '../components/ExoplanetsSection';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navbar />
      <HeroSection />
      <PlanetsSection />
      <TimelineSection />
      <InstrumentsSection />
      <ExoplanetsSection />
      <GallerySection />
      <NewsSection />
      <Footer />
    </div>
  );
};

export default HomePage;
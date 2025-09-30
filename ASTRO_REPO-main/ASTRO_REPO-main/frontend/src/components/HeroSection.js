import React from 'react';
import { Button } from './ui/button';
import { Rocket, Globe, Star } from 'lucide-react';

const HeroSection = () => {
  const scrollToPlanets = () => {
    const element = document.querySelector('#planetas');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1679729354919-2fe6201b1146"
          alt="Terra vista do espaço - NASA"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce">
        <Star className="h-8 w-8 text-yellow-300 opacity-80" />
      </div>
      <div className="absolute top-32 right-20 animate-pulse">
        <Star className="h-6 w-6 text-blue-300 opacity-60" />
      </div>
      <div className="absolute bottom-32 left-16 animate-bounce" style={{ animationDelay: '1s' }}>
        <Star className="h-5 w-5 text-white opacity-70" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-full">
            <Globe className="h-16 w-16 text-blue-300 animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">
          Sistema Solar Explorer
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto leading-relaxed">
          Explore o cosmos através dos olhos da NASA e ESA. Uma jornada educativa pelos mistérios do universo com dados científicos em tempo real.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={scrollToPlanets}
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <Rocket className="mr-2 h-5 w-5" />
            Iniciar Exploração
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => document.querySelector('#timeline')?.scrollIntoView({ behavior: 'smooth' })}
            className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-md px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            História da Exploração
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="text-3xl font-bold text-blue-300 mb-2">8</div>
            <div className="text-sm text-blue-100">Planetas Explorados</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="text-3xl font-bold text-purple-300 mb-2">6000+</div>
            <div className="text-sm text-purple-100">Exoplanetas Descobertos</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <div className="text-3xl font-bold text-green-300 mb-2">60+</div>
            <div className="text-sm text-green-100">Anos de Exploração</div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
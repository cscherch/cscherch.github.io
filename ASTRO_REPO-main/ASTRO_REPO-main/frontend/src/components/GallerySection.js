import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Filter, Download, ExternalLink } from 'lucide-react';

const GallerySection = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);

  const categories = [
    { id: 'all', name: 'Todas', count: 15 },
    { id: 'nebulae', name: 'Nebulosas', count: 4 },
    { id: 'galaxies', name: 'Galáxias', count: 3 },
    { id: 'solar_system', name: 'Sistema Solar', count: 5 },
    { id: 'instruments', name: 'Instrumentos', count: 3 }
  ];

  const images = [
    {
      id: 1,
      title: 'Via Láctea e Nebulosas',
      titleEn: 'Milky Way with Nebulae',
      category: 'nebulae',
      image: 'https://images.unsplash.com/photo-1530253051357-e0b79ee40459',
      description: 'Vista espetacular da Via Láctea mostrando regiões de formação estelar e nebulosas coloridas.',
      details: {
        source: 'NASA/ESA Astrofotografia',
        telescope: 'Ground-based Observatory',
        wavelength: 'Visível / Infravermelho',
        date: '2024',
        location: 'Centro Galáctico',
        significance: 'Mostra a estrutura complexa da nossa galáxia e regiões ativas de nascimento estelar'
      }
    },
    {
      id: 2,
      title: 'Galáxia NGC 4214',
      titleEn: 'NGC 4214 Galaxy',
      category: 'galaxies',
      image: 'https://images.unsplash.com/photo-1709408635158-8d735f0395c4',
      description: 'Galáxia anã irregular com intensa formação estelar, capturada pelo Telescópio Hubble.',
      details: {
        source: 'NASA/ESA Hubble Space Telescope',
        telescope: 'Hubble Space Telescope',
        wavelength: 'Visível / Ultravioleta',
        date: '2023',
        distance: '10 milhões de anos-luz',
        significance: 'Exemplo de galáxia com formação estelar ativa, similar às primeiras galáxias do universo'
      }
    },
    {
      id: 3,
      title: 'Terra - Blue Marble',
      titleEn: 'Earth Blue Marble',
      category: 'solar_system',
      image: 'https://images.unsplash.com/photo-1679729354919-2fe6201b1146',
      description: 'Icônica imagem da Terra vista do espaço, mostrando o continente africano e o oceano Índico.',
      details: {
        source: 'NASA Earth Observing System',
        satellite: 'Terra/Aqua Satellites',
        wavelength: 'Visível',
        date: '2024',
        altitude: '705 km',
        significance: 'Demonstra a beleza e fragilidade do nosso planeta visto do espaço'
      }
    },
    {
      id: 4,
      title: 'Superfície de Marte',
      titleEn: 'Mars Surface',
      category: 'solar_system',
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      description: 'Paisagem marciana capturada pelos rovers da NASA, mostrando o terreno rochoso e as colinas distantes.',
      details: {
        source: 'NASA Mars Exploration Program',
        rover: 'Curiosity/Perseverance',
        location: 'Cratera Gale / Cratera Jezero',
        date: '2024',
        sol: 'Vários sols marcianos',
        significance: 'Revela a geologia marciana e evidências de atividade aquática passada'
      }
    },
    {
      id: 5,
      title: 'Vênus - Mariner 10',
      titleEn: 'Venus by Mariner 10',
      category: 'solar_system',
      image: 'https://images.unsplash.com/photo-1614726365723-498aa67c5f7b',
      description: 'Imagem de Vênus capturada pela sonda Mariner 10, mostrando a densa atmosfera do planeta.',
      details: {
        source: 'NASA JPL',
        mission: 'Mariner 10',
        wavelength: 'Ultravioleta',
        date: '1974',
        distance: '5.768 km de Vênus',
        significance: 'Primeira imagem detalhada de Vênus, revelando padrões atmosféricos complexos'
      }
    },
    {
      id: 6,
      title: 'Urano - Voyager 2',
      titleEn: 'Uranus by Voyager 2',
      category: 'solar_system',
      image: 'https://images.unsplash.com/photo-1614732484003-ef9881555dc3',
      description: 'Imagem histórica de Urano capturada pela Voyager 2, mostrando sua cor azul-esverdeada característica.',
      details: {
        source: 'NASA JPL',
        mission: 'Voyager 2',
        wavelength: 'Visível',
        date: '1986',
        distance: '81.500 km de Urano',
        significance: 'Única sonda a visitar Urano, revelando seus anéis e luas'
      }
    },
    {
      id: 7,
      title: 'Netuno - Voyager 2',
      titleEn: 'Neptune by Voyager 2',
      category: 'solar_system',
      image: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e',
      description: 'Netuno em toda sua majestade azul, fotografado pela Voyager 2 durante seu sobrevoo histórico.',
      details: {
        source: 'NASA JPL',
        mission: 'Voyager 2',
        wavelength: 'Visível',
        date: '1989',
        distance: '4.400 km de Netuno',
        significance: 'Única sonda a visitar Netuno, descobrindo a Grande Mancha Escura e ventos extremos'
      }
    },
    {
      id: 8,
      title: 'Telescópio WFIRST',
      titleEn: 'WFIRST Telescope',
      category: 'instruments',
      image: 'https://images.unsplash.com/photo-1708257105880-11cd2deba6e8',
      description: 'Concepção artística do futuro Telescópio Nancy Grace Roman, sucessor do Hubble.',
      details: {
        source: 'NASA Goddard Space Flight Center',
        status: 'Em desenvolvimento',
        launch: '2027 (planejado)',
        mission: 'Caça de exoplanetas e energia escura',
        capabilities: 'Campo de visão 100x maior que o Hubble',
        significance: 'Revolucionará nossa compreensão de exoplanetas e cosmologia'
      }
    },
    {
      id: 9,
      title: 'Space Shuttle Atlantis',
      titleEn: 'Space Shuttle Atlantis Engines',
      category: 'instruments',
      image: 'https://images.unsplash.com/photo-1715648497450-c6737e6af85d',
      description: 'Motores principais do ônibus espacial Atlantis, mostrando a poderosa tecnologia de propulsão.',
      details: {
        source: 'NASA Kennedy Space Center',
        vehicle: 'Space Shuttle Atlantis',
        engines: '3 motores principais RS-25',
        missions: '33 missões completadas',
        retirement: '2011',
        significance: 'Representou 30 anos de voos espaciais tripulados e construção da ISS'
      }
    },
    {
      id: 10,
      title: 'Observatório Astronômico',
      titleEn: 'Astronomical Observatory',
      category: 'instruments',
      image: 'https://images.unsplash.com/photo-1505579962197-df174377e13f',
      description: 'Observatório astronômico sob o céu estrelado, representando a busca humana pelo conhecimento cósmico.',
      details: {
        source: 'Ground-based Observatory',
        type: 'Telescópio Óptico',
        location: 'Local de céu escuro',
        purpose: 'Observação astronômica',
        wavelength: 'Visível',
        significance: 'Representa a tradição de observação astronômica desde a Terra'
      }
    },
    {
      id: 11,
      title: 'Nebulosa Carina',
      titleEn: 'Carina Nebula',
      category: 'nebulae',
      image: 'https://images.unsplash.com/photo-1530253051357-e0b79ee40459',
      description: 'A majestosa Nebulosa Carina, uma das maiores e mais brilhantes nebulosas do céu.',
      details: {
        source: 'NASA/ESA Hubble Space Telescope',
        telescope: 'Hubble Space Telescope',
        distance: '7.500 anos-luz',
        size: '300 anos-luz de diâmetro',
        type: 'Nebulosa de emissão',
        significance: 'Região ativa de formação de estrelas massivas'
      }
    },
    {
      id: 12,
      title: 'Galáxia Espiral',
      titleEn: 'Spiral Galaxy',
      category: 'galaxies',
      image: 'https://images.unsplash.com/photo-1709408635158-8d735f0395c4',
      description: 'Bela galáxia espiral mostrando braços bem definidos e núcleo brilhante.',
      details: {
        source: 'NASA/ESA Hubble Space Telescope',
        telescope: 'Hubble Space Telescope',
        type: 'Galáxia espiral',
        distance: 'Milhões de anos-luz',
        stars: 'Bilhões de estrelas',
        significance: 'Exemplo da estrutura espiral comum em galáxias como a Via Láctea'
      }
    },
    {
      id: 13,
      title: 'Campo Profundo',
      titleEn: 'Deep Field',
      category: 'galaxies',
      image: 'https://images.pexels.com/photos/7568783/pexels-photo-7568783.jpeg',
      description: 'Campo profundo mostrando milhares de galáxias distantes em diferentes estágios evolutivos.',
      details: {
        source: 'NASA/ESA/James Webb Space Telescope',
        telescope: 'James Webb Space Telescope',
        exposure: 'Exposição de várias horas',
        galaxies: 'Milhares de galáxias visíveis',
        lookback: 'Até 13 bilhões de anos',
        significance: 'Janela para o universo primitivo e evolução galáctica'
      }
    },
    {
      id: 14,
      title: 'Nebulosa Planetária',
      titleEn: 'Planetary Nebula',
      category: 'nebulae',
      image: 'https://images.unsplash.com/photo-1530253051357-e0b79ee40459',
      description: 'Nebulosa planetária formada pelos últimos suspiros de uma estrela moribunda.',
      details: {
        source: 'NASA/ESA Hubble Space Telescope',
        telescope: 'Hubble Space Telescope',
        type: 'Nebulosa planetária',
        formation: 'Estrela em estágio final',
        duration: 'Alguns milhares de anos',
        significance: 'Mostra o destino de estrelas como o Sol'
      }
    },
    {
      id: 15,
      title: 'Região de Formação Estelar',
      titleEn: 'Star Formation Region',
      category: 'nebulae',
      image: 'https://images.unsplash.com/photo-1530253051357-e0b79ee40459',
      description: 'Região ativa onde novas estrelas estão nascendo a partir de nuvens de gás e poeira cósmica.',
      details: {
        source: 'NASA/ESA Space Telescopes',
        process: 'Colapso gravitacional',
        timeline: 'Milhões de anos',
        products: 'Novas estrelas e sistemas planetários',
        temperature: 'Milhares de graus Kelvin',
        significance: 'Berçário estelar onde nascem futuras gerações de estrelas'
      }
    }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  return (
    <section id="galeria" className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Galeria Espacial Autêntica
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Explore nossa coleção de imagens reais capturadas por telescópios espaciais, 
            sondas e observatórios da NASA e ESA.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className={`transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category.id 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'hover:bg-blue-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        src={image.image}
                        alt={image.title}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 right-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                        <h3 className="text-white font-semibold text-sm mb-1">{image.title}</h3>
                        <p className="text-white/90 text-xs">{image.titleEn}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <Badge 
                        variant="outline" 
                        className="mb-2 text-xs"
                      >
                        {categories.find(cat => cat.id === image.category)?.name}
                      </Badge>
                      <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                        {image.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {image.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Full Size Image */}
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={image.image}
                      alt={image.title}
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  </div>
                  
                  {/* Image Info */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">{image.title}</h2>
                        <p className="text-lg text-slate-600 mb-2">{image.titleEn}</p>
                        <Badge className="mb-4">
                          {categories.find(cat => cat.id === image.category)?.name}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          NASA/ESA
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 leading-relaxed">{image.description}</p>
                    
                    {/* Technical Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {Object.entries(image.details).map(([key, value]) => {
                        const labels = {
                          source: 'Fonte',
                          telescope: 'Telescópio',
                          satellite: 'Satélite',
                          mission: 'Missão',
                          rover: 'Rover',
                          wavelength: 'Comprimento de Onda',
                          date: 'Data',
                          distance: 'Distância',
                          location: 'Localização',
                          altitude: 'Altitude',
                          sol: 'Sol Marciano',
                          status: 'Status',
                          launch: 'Lançamento',
                          capabilities: 'Capacidades',
                          significance: 'Significância',
                          type: 'Tipo',
                          size: 'Tamanho',
                          formation: 'Formação',
                          duration: 'Duração',
                          process: 'Processo',
                          timeline: 'Cronologia',
                          products: 'Produtos',
                          temperature: 'Temperatura',
                          exposure: 'Exposição',
                          galaxies: 'Galáxias',
                          lookback: 'Tempo Lookback',
                          stars: 'Estrelas',
                          engines: 'Motores',
                          missions: 'Missões',
                          retirement: 'Aposentadoria',
                          vehicle: 'Veículo',
                          purpose: 'Propósito'
                        };
                        
                        return (
                          <div key={key} className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-slate-800 mb-1">
                              {labels[key] || key}
                            </h4>
                            <p className="text-sm text-slate-600">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
        
        {filteredImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">Nenhuma imagem encontrada nesta categoria.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
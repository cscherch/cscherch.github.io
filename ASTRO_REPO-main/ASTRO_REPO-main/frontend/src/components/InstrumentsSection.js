import React from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Telescope, Rocket, MapPin, Calendar, Globe, Camera } from 'lucide-react';

const InstrumentsSection = () => {
  const telescopes = [
    {
      id: 1,
      name: 'Hubble',
      fullName: 'Telescópio Espacial Hubble',
      image: 'https://images.unsplash.com/photo-1505579962197-df174377e13f',
      launchYear: 1990,
      status: 'Ativo',
      specs: {
        mirror: '2,4 metros de diâmetro',
        altitude: '547 km de altitude',
        orbit: 'Órbita terrestre baixa',
        wavelengths: 'Visível, UV, infravermelho próximo'
      },
      achievements: [
        'Mais de 1,5 milhão de observações',
        'Descoberta da aceleração da expansão universal',
        'Determinação da idade do universo (13,8 bilhões de anos)',
        'Observação de galáxias distantes e nebulosas',
        'Contribuição para a descoberta de exoplanetas'
      ]
    },
    {
      id: 2,
      name: 'James Webb',
      fullName: 'Telescópio Espacial James Webb',
      image: 'https://images.unsplash.com/photo-1708257105880-11cd2deba6e8',
      launchYear: 2021,
      status: 'Ativo',
      specs: {
        mirror: '6,5 metros de diâmetro',
        location: 'Ponto Lagrange L2 (1,5 milhão km)',
        temperature: '-223°C (operação)',
        wavelengths: 'Infravermelho (0,6 a 28,5 mícrons)'
      },
      achievements: [
        'Imagens mais nítidas do espaço profundo',
        'Observação das primeiras galáxias do universo',
        'Análise de atmosferas de exoplanetas',
        'Estudo da formação estelar e planetária',
        'Revolução na compreensão do cosmos primitivo'
      ]
    },
    {
      id: 3,
      name: 'Kepler',
      fullName: 'Telescópio Espacial Kepler',
      image: 'https://images.unsplash.com/photo-1715648497450-c6737e6af85d',
      launchYear: 2009,
      status: 'Aposentado (2018)',
      specs: {
        mirror: '0,95 metros de diâmetro',
        mission: 'Caçador de exoplanetas',
        method: 'Fotometria de trânsito',
        field: '115 graus quadrados do céu'
      },
      achievements: [
        'Descoberta de mais de 2.600 exoplanetas',
        'Confirmação de planetas rochosos na zona habitável',
        'Revelação da diversidade de sistemas planetários',
        'Descoberta de sistemas com múltiplos planetas',
        'Base para missões futuras de busca por vida'
      ]
    }
  ];

  const rovers = [
    {
      id: 1,
      name: 'Curiosity',
      fullName: 'Mars Science Laboratory Curiosity',
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      launchYear: 2011,
      landingYear: 2012,
      status: 'Ativo (12+ anos)',
      specs: {
        weight: '899 kg',
        cameras: '17 câmeras',
        instruments: '10 instrumentos científicos',
        power: 'Gerador termoeletrico de radoisótopos'
      },
      achievements: [
        'Confirmação de ambientes habitáveis passados',
        'Descoberta de moléculas orgânicas complexas',
        'Análise detalhada da geologia marciana',
        'Detecção de metano na atmosfera',
        'Perfuração de rochas para análise interna'
      ]
    },
    {
      id: 2,
      name: 'Perseverance',
      fullName: 'Mars 2020 Perseverance Rover',
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      launchYear: 2020,
      landingYear: 2021,
      status: 'Ativo',
      specs: {
        weight: '1.050 kg',
        cameras: '23 câmeras',
        companion: 'Helicóptero Ingenuity',
        mission: 'Coleta de amostras para retorno'
      },
      achievements: [
        'Primeiro voo powered em outro planeta (Ingenuity)',
        'Coleta de amostras para futura devolução à Terra',
        'Produção experimental de oxigênio (MOXIE)',
        'Busca ativa por sinais de vida microbiana passada',
        'Exploração da cratera Jezero (antigo lago)'
      ]
    },
    {
      id: 3,
      name: 'Opportunity',
      fullName: 'Mars Exploration Rover Opportunity',
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      launchYear: 2003,
      landingYear: 2004,
      status: 'Aposentado (2018)',
      specs: {
        weight: '185 kg',
        mission: '90 sols planejados, 5.352 sols reais',
        distance: '45,16 km percorridos',
        power: 'Painéis solares'
      },
      achievements: [
        'Missão mais longa em superfície planetária',
        'Descoberta de evidências de água líquida passada',
        'Análise de meteoritos marcianos',
        'Estudo de tempestades de areia globais',
        'Exploração de crater Endeavour'
      ]
    }
  ];

  const launchSites = [
    {
      id: 1,
      name: 'Kennedy Space Center',
      location: 'Flórida, EUA',
      image: 'https://images.unsplash.com/photo-1715648497450-c6737e6af85d',
      established: 1962,
      operator: 'NASA',
      specs: {
        area: '567 km²',
        coastline: '92 km de costa atlântica',
        platforms: '39A, 39B (históricas)',
        launches: 'Apollo, Space Shuttle, ISS'
      },
      achievements: [
        'Lançamento de todas as missões Apollo',
        'Base para 135 missões do Space Shuttle',
        'Lançamentos regulares para a ISS',
        'Parceria com SpaceX e Blue Origin',
        'Futuros lançamentos para a Lua e Marte'
      ]
    },
    {
      id: 2,
      name: 'Baikonur Cosmodrome',
      location: 'Cazaquistão',
      image: 'https://images.unsplash.com/photo-1691085220902-6e4ce8887d4f',
      established: 1955,
      operator: 'Roscosmos (Rússia)',
      specs: {
        area: '6.717 km²',
        altitude: '90 metros',
        platforms: '15 plataformas ativas',
        launches: 'Soyuz, Progress, Proton'
      },
      achievements: [
        'Lançamento do Sputnik 1 (primeiro satélite)',
        'Lançamento de Yuri Gagarin (primeiro humano no espaço)',
        'Principal acesso à Estação Espacial Internacional',
        'Mais de 1.500 lançamentos realizados',
        'Base para missões lunares e planetárias russas'
      ]
    },
    {
      id: 3,
      name: 'Centre Spatial Guyanais',
      location: 'Kourou, Guiana Francesa',
      image: 'https://images.unsplash.com/photo-1508257105880-11cd2deba6e8',
      established: 1968,
      operator: 'ESA (Agência Espacial Europeia)',
      specs: {
        area: '690 km²',
        latitude: '5° Norte (vantagem equatorial)',
        platforms: 'Ariane 5, Vega, Soyuz',
        launches: 'Satélites comerciais e científicos'
      },
      achievements: [
        'Principal base de lançamento comercial da Europa',
        'Lançamento do Telescópio James Webb',
        'Mais de 300 lançamentos do Ariane',
        'Líder em lançamentos comerciais de satélites',
        'Vantagem da localização equatorial para órbitas'
      ]
    }
  ];

  const renderInstrumentCard = (item, type) => {
    const getIcon = () => {
      switch(type) {
        case 'telescopes': return Telescope;
        case 'rovers': return Rocket;
        case 'launch': return MapPin;
        default: return Globe;
      }
    };
    
    const Icon = getIcon();
    
    return (
      <Card key={item.id} className="h-full hover:shadow-lg transition-all duration-300 transform hover:scale-105">
        <CardContent className="p-0">
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge className={`${
                item.status?.includes('Ativo') ? 'bg-green-500' : 
                item.status?.includes('Aposentado') ? 'bg-gray-500' : 'bg-blue-500'
              }`}>
                {item.status || `Est. ${item.established}`}
              </Badge>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                <p className="text-sm text-slate-600">{item.fullName || item.location}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(item.specs).slice(0, 4).map(([key, value]) => (
                <div key={key} className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs font-medium text-slate-500 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-3">Conquistas Principais:</h4>
              <div className="space-y-2">
                {item.achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-600">{achievement}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {type === 'telescopes' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                <span>Lançado em {item.launchYear}</span>
              </div>
            )}
            
            {type === 'rovers' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Globe className="h-4 w-4" />
                <span>Pouso em {item.landingYear}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section id="instrumentos" className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Instrumentos Científicos
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Conheça os telescópios, rovers e bases de lançamento que tornam possível 
            a exploração do cosmos e a busca por respostas fundamentais.
          </p>
        </div>

        <Tabs defaultValue="telescopes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="telescopes" className="flex items-center gap-2">
              <Telescope className="h-4 w-4" />
              Telescópios
            </TabsTrigger>
            <TabsTrigger value="rovers" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Sondas & Rovers
            </TabsTrigger>
            <TabsTrigger value="launch" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Bases de Lançamento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="telescopes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {telescopes.map(telescope => renderInstrumentCard(telescope, 'telescopes'))}
            </div>
          </TabsContent>
          
          <TabsContent value="rovers">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rovers.map(rover => renderInstrumentCard(rover, 'rovers'))}
            </div>
          </TabsContent>
          
          <TabsContent value="launch">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {launchSites.map(site => renderInstrumentCard(site, 'launch'))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default InstrumentsSection;
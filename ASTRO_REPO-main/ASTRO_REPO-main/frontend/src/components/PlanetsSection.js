import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Globe, Thermometer, Clock, Ruler, Weight, Moon } from 'lucide-react';

const PlanetsSection = () => {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const planets = [
    {
      id: 1,
      name: 'Mercúrio',
      nameEn: 'Mercury',
      image: 'https://images.unsplash.com/photo-1614726365723-498aa67c5f7b',
      color: 'from-gray-400 to-orange-300',
      diameter: '4.879 km',
      mass: '3,3 × 10²³ kg',
      distance: '0,39 UA',
      temperature: '427°C (dia) / -173°C (noite)',
      moons: 0,
      orbitalPeriod: '88 dias terrestres',
      facts: [
        'Planeta mais próximo do Sol',
        'Tem o dia mais longo do Sistema Solar (176 dias terrestres)',
        'Não possui atmosfera significativa',
        'Superfície coberta de crateras como a Lua',
        'Temperaturas extremas devido à falta de atmosfera'
      ],
      missions: [
        'Mariner 10 (1974-1975) - Primeiras imagens detalhadas',
        'MESSENGER (2011-2015) - Mapeamento completo',
        'BepiColombo (2018-presente) - Missão conjunta ESA/JAXA'
      ],
      structure: {
        core: 'Núcleo de ferro de 3.600 km de diâmetro',
        mantle: 'Manto rochoso fino de 600 km',
        crust: 'Crosta rochosa de 100-300 km'
      }
    },
    {
      id: 2,
      name: 'Vênus',
      nameEn: 'Venus',
      image: 'https://images.unsplash.com/photo-1614726365723-498aa67c5f7b',
      color: 'from-yellow-300 to-orange-400',
      diameter: '12.104 km',
      mass: '4,87 × 10²⁴ kg',
      distance: '0,72 UA',
      temperature: '462°C (constante)',
      moons: 0,
      orbitalPeriod: '225 dias terrestres',
      facts: [
        'Planeta mais quente do Sistema Solar',
        'Gira no sentido contrário aos outros planetas',
        'Conhecido como "Estrela da Manhã" ou "Estrela da Tarde"',
        'Pressão atmosférica 90 vezes maior que a Terra',
        'Atmosfera composta principalmente de CO₂'
      ],
      missions: [
        'Venera (1961-1984) - Série soviética de sondas',
        'Magellan (1989-1994) - Mapeamento por radar',
        'Venus Express (2006-2014) - Estudo atmosférico',
        'Parker Solar Probe (2018-presente) - Sobrevoos'
      ],
      structure: {
        core: 'Núcleo de ferro-níquel de 3.200 km',
        mantle: 'Manto rochoso de 3.000 km',
        crust: 'Crosta basáltica de 50 km'
      }
    },
    {
      id: 3,
      name: 'Terra',
      nameEn: 'Earth',
      image: 'https://images.unsplash.com/photo-1679729354919-2fe6201b1146',
      color: 'from-blue-400 to-green-400',
      diameter: '12.756 km',
      mass: '5,97 × 10²⁴ kg',
      distance: '1,00 UA',
      temperature: '15°C (média)',
      moons: 1,
      orbitalPeriod: '365,25 dias',
      facts: [
        'Único planeta conhecido com vida',
        '71% da superfície coberta por água',
        'Possui campo magnético protetor',
        'Atmosfera com 21% de oxigênio',
        'Idade aproximada de 4,5 bilhões de anos'
      ],
      missions: [
        'Countless Earth observation satellites',
        'ISS - International Space Station',
        'Landsat program - Earth monitoring',
        'Terra/Aqua satellites - Climate studies'
      ],
      structure: {
        core: 'Núcleo interno sólido e externo líquido',
        mantle: 'Manto rochoso de silicatos',
        crust: 'Crosta oceânica e continental'
      }
    },
    {
      id: 4,
      name: 'Marte',
      nameEn: 'Mars',
      image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      color: 'from-red-400 to-orange-500',
      diameter: '6.792 km',
      mass: '6,42 × 10²³ kg',
      distance: '1,52 UA',
      temperature: '-65°C (média)',
      moons: 2,
      orbitalPeriod: '687 dias terrestres',
      facts: [
        'Conhecido como "Planeta Vermelho"',
        'Possui o maior vulcão do Sistema Solar (Monte Olimpo)',
        'Tem evidências de água líquida no passado',
        'Dias similares aos da Terra (24h 37min)',
        'Atmosfera fina composta principalmente de CO₂'
      ],
      missions: [
        'Viking 1 e 2 (1976) - Primeiros pousos bem-sucedidos',
        'Pathfinder/Sojourner (1997) - Primeiro rover',
        'Spirit e Opportunity (2004) - Rovers de longa duração',
        'Curiosity (2012) - Laboratório móvel',
        'Perseverance (2021) - Busca por vida passada'
      ],
      structure: {
        core: 'Núcleo de ferro-níquel parcialmente líquido',
        mantle: 'Manto rochoso rico em ferro',
        crust: 'Crosta basáltica com óxidos de ferro'
      }
    },
    {
      id: 5,
      name: 'Júpiter',
      nameEn: 'Jupiter',
      image: 'https://images.pexels.com/photos/12491775/pexels-photo-12491775.jpeg',
      color: 'from-orange-300 to-red-400',
      diameter: '142.984 km',
      mass: '1,90 × 10²⁷ kg',
      distance: '5,20 UA',
      temperature: '-110°C (topo das nuvens)',
      moons: 79,
      orbitalPeriod: '12 anos terrestres',
      facts: [
        'Maior planeta do Sistema Solar',
        'Possui a Grande Mancha Vermelha - tempestade gigante',
        'Tem mais de 79 luas conhecidas',
        'Protege a Terra de asteroides e cometas',
        'Composto principalmente de hidrogênio e hélio'
      ],
      missions: [
        'Pioneer 10 e 11 (1973-1974) - Primeiros sobrevoos',
        'Voyager 1 e 2 (1979) - Descoberta dos anéis',
        'Galileo (1995-2003) - Estudo detalhado',
        'Juno (2016-presente) - Estudo do interior'
      ],
      structure: {
        core: 'Possível núcleo rochoso pequeno',
        mantle: 'Hidrogênio metálico líquido',
        atmosphere: 'Atmosfera de hidrogênio e hélio'
      }
    },
    {
      id: 6,
      name: 'Saturno',
      nameEn: 'Saturn',
      image: 'https://images.pexels.com/photos/12491775/pexels-photo-12491775.jpeg',
      color: 'from-yellow-200 to-orange-300',
      diameter: '120.536 km',
      mass: '5,68 × 10²⁶ kg',
      distance: '9,58 UA',
      temperature: '-140°C (topo das nuvens)',
      moons: 82,
      orbitalPeriod: '29 anos terrestres',
      facts: [
        'Famoso por seus espetaculares anéis',
        'Menos denso que a água - flutuaria!',
        'Possui 82 luas confirmadas',
        'Titã, sua maior lua, tem atmosfera densa',
        'Ventos de até 500 m/s no equador'
      ],
      missions: [
        'Pioneer 11 (1979) - Primeiro sobrevoo',
        'Voyager 1 e 2 (1980-1981) - Descobertas importantes',
        'Cassini-Huygens (2004-2017) - Estudo detalhado dos anéis e luas'
      ],
      structure: {
        core: 'Núcleo rochoso de 25.000 km',
        mantle: 'Hidrogênio metálico e molecular',
        atmosphere: 'Atmosfera de hidrogênio e hélio'
      }
    },
    {
      id: 7,
      name: 'Urano',
      nameEn: 'Uranus',
      image: 'https://images.unsplash.com/photo-1614732484003-ef9881555dc3',
      color: 'from-cyan-300 to-blue-400',
      diameter: '51.118 km',
      mass: '8,68 × 10²⁵ kg',
      distance: '19,22 UA',
      temperature: '-195°C (topo das nuvens)',
      moons: 27,
      orbitalPeriod: '84 anos terrestres',
      facts: [
        'Gira "deitado" - eixo inclinado 98°',
        'Primeiro planeta descoberto com telescópio (1781)',
        'Tem anéis verticais únicos',
        'Composto de água, metano e amônia',
        'Cor azul-esverdeada devido ao metano'
      ],
      missions: [
        'Voyager 2 (1986) - Única sonda a visitar Urano',
        'Descobriu 10 novas luas e anéis adicionais',
        'Futuras missões em planejamento pela NASA/ESA'
      ],
      structure: {
        core: 'Núcleo rochoso pequeno',
        mantle: 'Gelo de água, amônia e metano',
        atmosphere: 'Hidrogênio, hélio e metano'
      }
    },
    {
      id: 8,
      name: 'Netuno',
      nameEn: 'Neptune',
      image: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e',
      color: 'from-blue-500 to-indigo-600',
      diameter: '49.528 km',
      mass: '1,02 × 10²⁶ kg',
      distance: '30,05 UA',
      temperature: '-200°C (topo das nuvens)',
      moons: 14,
      orbitalPeriod: '165 anos terrestres',
      facts: [
        'Planeta mais distante do Sistema Solar',
        'Descoberto por cálculos matemáticos (1846)',
        'Ventos mais fortes do Sistema Solar (até 2.100 km/h)',
        'Tritão, sua maior lua, gira no sentido contrário',
        'Leva 165 anos terrestres para completar uma órbita'
      ],
      missions: [
        'Voyager 2 (1989) - Única sonda a visitar Netuno',
        'Descobriu 6 novas luas e anéis',
        'Nenhuma missão futura confirmada ainda'
      ],
      structure: {
        core: 'Núcleo rochoso do tamanho da Terra',
        mantle: 'Gelo de água, amônia e metano',
        atmosphere: 'Hidrogênio, hélio e metano'
      }
    }
  ];

  return (
    <section id="planetas" className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Os Oito Planetas
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Explore cada mundo único do nosso Sistema Solar com dados científicos precisos 
            e imagens reais das missões espaciais da NASA e ESA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {planets.map((planet) => (
            <Dialog key={planet.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={planet.image}
                        alt={planet.name}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${planet.color} opacity-60 group-hover:opacity-40 transition-opacity duration-300`}></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-2xl font-bold mb-1">{planet.name}</h3>
                        <p className="text-sm opacity-90">{planet.distance} do Sol</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline" className="text-xs">
                          {planet.moons} {planet.moons === 1 ? 'lua' : 'luas'}
                        </Badge>
                        <span className="text-sm text-slate-500">{planet.orbitalPeriod}</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Clique para explorar informações detalhadas, missões espaciais e curiosidades científicas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-center mb-4">
                    {planet.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Header Image */}
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <img
                      src={planet.image}
                      alt={planet.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-r ${planet.color} opacity-30`}></div>
                  </div>

                  <Tabs defaultValue="dados" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="dados">Dados</TabsTrigger>
                      <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
                      <TabsTrigger value="missoes">Missões</TabsTrigger>
                      <TabsTrigger value="curiosidades">Fatos</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="dados" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Ruler className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">Diâmetro</span>
                          </div>
                          <p className="text-lg">{planet.diameter}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Weight className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">Massa</span>
                          </div>
                          <p className="text-lg">{planet.mass}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-5 w-5 text-purple-600" />
                            <span className="font-semibold">Distância</span>
                          </div>
                          <p className="text-lg">{planet.distance}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Thermometer className="h-5 w-5 text-red-600" />
                            <span className="font-semibold">Temperatura</span>
                          </div>
                          <p className="text-lg">{planet.temperature}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Moon className="h-5 w-5 text-yellow-600" />
                            <span className="font-semibold">Luas</span>
                          </div>
                          <p className="text-lg">{planet.moons}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            <span className="font-semibold">Período Orbital</span>
                          </div>
                          <p className="text-lg">{planet.orbitalPeriod}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="estrutura" className="space-y-4">
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold mb-4">Estrutura Interna</h4>
                        {Object.entries(planet.structure).map(([layer, description]) => (
                          <div key={layer} className="bg-slate-50 p-4 rounded-lg">
                            <h5 className="font-semibold capitalize mb-2">
                              {layer === 'core' ? 'Núcleo' : 
                               layer === 'mantle' ? 'Manto' : 
                               layer === 'crust' ? 'Crosta' : 
                               layer === 'atmosphere' ? 'Atmosfera' : layer}
                            </h5>
                            <p className="text-slate-700">{description}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="missoes" className="space-y-4">
                      <h4 className="text-xl font-semibold mb-4">Missões Espaciais</h4>
                      <div className="space-y-3">
                        {planet.missions.map((mission, index) => (
                          <div key={index} className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-slate-700">{mission}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="curiosidades" className="space-y-4">
                      <h4 className="text-xl font-semibold mb-4">Fatos Interessantes</h4>
                      <div className="space-y-3">
                        {planet.facts.map((fact, index) => (
                          <div key={index} className="bg-slate-50 p-4 rounded-lg flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <p className="text-slate-700">{fact}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlanetsSection;
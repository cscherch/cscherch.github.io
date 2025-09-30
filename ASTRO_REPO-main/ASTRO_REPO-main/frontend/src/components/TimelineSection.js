import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Rocket, Satellite, Users, Globe } from 'lucide-react';

const TimelineSection = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const timelineEvents = [
    {
      id: 1,
      year: 1957,
      title: 'Sputnik 1',
      subtitle: 'Início da Era Espacial',
      description: 'O primeiro satélite artificial da humanidade foi lançado pela União Soviética, marcando o início da exploração espacial.',
      icon: Satellite,
      color: 'bg-red-500',
      details: {
        significance: 'Marco inaugural da corrida espacial entre EUA e URSS',
        technology: 'Satélite esférico de 58 cm de diâmetro pesando 83,6 kg',
        impact: 'Demonstrou a capacidade tecnológica da URSS e iniciou a era da comunicação via satélite',
        legacy: 'Inspirou o desenvolvimento de milhares de satélites que hoje conectam o mundo'
      }
    },
    {
      id: 2,
      year: 1961,
      title: 'Yuri Gagarin',
      subtitle: 'Primeiro Humano no Espaço',
      description: 'O cosmonauta soviético Yuri Gagarin se tornou o primeiro ser humano a viajar para o espaço e orbitar a Terra.',
      icon: Users,
      color: 'bg-blue-500',
      details: {
        significance: 'Primeiro voo espacial tripulado da história',
        mission: 'Vostok 1 - 108 minutos orbitando a Terra',
        impact: 'Provou que humanos poderiam sobreviver no espaço',
        legacy: 'Abriu caminho para todas as missões tripuladas futuras'
      }
    },
    {
      id: 3,
      year: 1969,
      title: 'Apollo 11',
      subtitle: 'Chegada à Lua',
      description: 'Neil Armstrong e Buzz Aldrin se tornaram os primeiros humanos a pisar na superfície lunar.',
      icon: Globe,
      color: 'bg-yellow-500',
      details: {
        significance: 'Cumprimento da promessa de Kennedy de chegar à Lua antes do fim da década',
        crew: 'Neil Armstrong, Buzz Aldrin e Michael Collins',
        achievement: 'Primeiro pouso lunar tripulado da história',
        legacy: 'Demonstrou o potencial da cooperação internacional na exploração espacial'
      }
    },
    {
      id: 4,
      year: 1990,
      title: 'Hubble',
      subtitle: 'Telescópio Espacial',
      description: 'Lançamento do Telescópio Espacial Hubble, revolucionando nossa compreensão do universo.',
      icon: Satellite,
      color: 'bg-purple-500',
      details: {
        significance: 'Primeiro grande telescópio espacial',
        capabilities: 'Observações no visível, ultravioleta e infravermelho próximo',
        discoveries: 'Descobriu a aceleração da expansão do universo',
        legacy: 'Mais de 1,5 milhão de observações e milhares de descobertas'
      }
    },
    {
      id: 5,
      year: 2004,
      title: 'Spirit e Opportunity',
      subtitle: 'Rovers Marcianos',
      description: 'Dois rovers pousaram em Marte para estudar sua geologia e buscar evidências de água passada.',
      icon: Rocket,
      color: 'bg-red-600',
      details: {
        significance: 'Primeira missão de longa duração na superfície marciana',
        duration: 'Missão planejada para 90 dias, durou mais de 6 anos (Opportunity 15 anos)',
        discoveries: 'Confirmação de água líquida no passado marciano',
        legacy: 'Pavimentou o caminho para as missões atuais em Marte'
      }
    },
    {
      id: 6,
      year: 2012,
      title: 'Curiosity',
      subtitle: 'Laboratório Móvel em Marte',
      description: 'O rover Curiosity pousou em Marte com instrumentos científicos avançados para estudar a habitabilidade passada.',
      icon: Rocket,
      color: 'bg-orange-500',
      details: {
        significance: 'Rover mais sofisticado enviado a Marte até então',
        capabilities: '17 câmeras e 10 instrumentos científicos',
        discoveries: 'Evidências de ambientes habitáveis no passado marciano',
        status: 'Ainda ativo após mais de 12 anos de operação'
      }
    },
    {
      id: 7,
      year: 2021,
      title: 'James Webb',
      subtitle: 'Sucessor do Hubble',
      description: 'Lançamento do maior e mais poderoso telescópio espacial já construído pela humanidade.',
      icon: Satellite,
      color: 'bg-indigo-500',
      details: {
        significance: 'Telescópio espacial mais avançado já construído',
        capabilities: 'Observações no infravermelho com espelho de 6,5 metros',
        location: 'Ponto Lagrange L2, a 1,5 milhão de km da Terra',
        mission: 'Estudar as primeiras galáxias do universo e exoplanetas'
      }
    },
    {
      id: 8,
      year: 2021,
      title: 'Perseverance',
      subtitle: 'Busca por Vida em Marte',
      description: 'O rover Perseverance começou a coletar amostras de rochas marcianas para futura devolução à Terra.',
      icon: Rocket,
      color: 'bg-green-500',
      details: {
        significance: 'Primeira missão a coletar amostras para retorno à Terra',
        technology: '23 câmeras e 7 instrumentos científicos',
        companion: 'Inclui o helicóptero Ingenuity - primeiro voo powered em outro planeta',
        mission: 'Buscar sinais de vida microbiana passada em Marte'
      }
    },
    {
      id: 9,
      year: 2025,
      title: '6.000 Exoplanetas',
      subtitle: 'Marco Atual',
      description: 'A humanidade descobriu mais de 6.000 planetas orbitando outras estrelas, expandindo nossa compreensão dos sistemas planetários.',
      icon: Globe,
      color: 'bg-cyan-500',
      details: {
        significance: 'Marco na busca por mundos habitáveis',
        methods: 'Trânsito, velocidade radial, imageamento direto e microlente',
        discoveries: 'Planetas rochosos, gigantes gasosos, super-Terras e mini-Netunos',
        future: 'Missões futuras buscarão sinais de vida em exoplanetas'
      }
    }
  ];

  return (
    <section id="timeline" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Timeline da Exploração Espacial
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Uma jornada através dos marcos mais importantes da exploração espacial, 
            desde o primeiro satélite até as descobertas mais recentes.
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-300 via-purple-300 to-cyan-300 rounded-full"></div>

          <div className="space-y-12">
            {timelineEvents.map((event, index) => {
              const IconComponent = event.icon;
              const isLeft = index % 2 === 0;
              
              return (
                <div key={event.id} className={`relative flex items-center ${
                  isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}>
                  {/* Timeline Node */}
                  <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-400 rounded-full z-10"></div>
                  
                  {/* Content */}
                  <div className={`ml-20 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-16' : 'md:pl-16'}`}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`p-3 ${event.color} rounded-full`}>
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <Badge variant="outline" className="mb-2">
                                  {event.year}
                                </Badge>
                                <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
                                <p className="text-sm font-medium text-blue-600">{event.subtitle}</p>
                              </div>
                            </div>
                            <p className="text-slate-600 leading-relaxed">
                              {event.description}
                            </p>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`p-4 ${event.color} rounded-full`}>
                              <IconComponent className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <Badge className="mb-2">{event.year}</Badge>
                              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                              <p className="text-lg text-blue-600 font-medium">{event.subtitle}</p>
                            </div>
                          </div>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          <p className="text-slate-700 text-lg leading-relaxed">
                            {event.description}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(event.details).map(([key, value]) => {
                              const labels = {
                                significance: 'Significância',
                                technology: 'Tecnologia',
                                mission: 'Missão',
                                crew: 'Tripulação',
                                achievement: 'Conquista',
                                capabilities: 'Capacidades',
                                discoveries: 'Descobertas',
                                duration: 'Duração',
                                status: 'Status',
                                location: 'Localização',
                                companion: 'Companheiro',
                                methods: 'Métodos',
                                future: 'Futuro',
                                impact: 'Impacto',
                                legacy: 'Legado'
                              };
                              
                              return (
                                <div key={key} className="bg-slate-50 p-4 rounded-lg">
                                  <h4 className="font-semibold text-slate-800 mb-2">
                                    {labels[key] || key}
                                  </h4>
                                  <p className="text-slate-600 text-sm">{value}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineSection;
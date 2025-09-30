import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Globe, Telescope, TrendingUp, Search, Eye, Zap, Waves } from 'lucide-react';

const ExoplanetsSection = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const detectionMethods = [
    {
      id: 1,
      name: 'Trânsito',
      nameEn: 'Transit',
      icon: Eye,
      color: 'bg-blue-500',
      description: 'Detecção pela diminuição do brilho estelar quando o planeta passa na frente da estrela',
      percentage: '76%',
      discovered: '4.500+',
      details: {
        principle: 'Quando um planeta passa entre sua estrela e nós, ele bloqueia uma pequena quantidade da luz estelar, causando uma diminuição peridiódica no brilho observado.',
        advantages: 'Permite determinar o tamanho do planeta, período orbital e, em alguns casos, composição atmosférica',
        limitations: 'Requer alinhamento preciso entre planeta, estrela e observador',
        missions: 'Kepler, TESS, CoRoT, CHEOPS',
        example: 'HD 209458 b foi o primeiro exoplaneta detectado por trânsito em 1999'
      }
    },
    {
      id: 2,
      name: 'Velocidade Radial',
      nameEn: 'Radial Velocity',
      icon: Waves,
      color: 'bg-green-500',
      description: 'Medição da oscilação da estrela causada pela atração gravitacional do planeta',
      percentage: '18%',
      discovered: '1.000+',
      details: {
        principle: 'A atração gravitacional do planeta faz a estrela oscilar ligeiramente, alterando a cor da luz estelar pelo efeito Doppler.',
        advantages: 'Pode determinar a massa mínima do planeta e características orbitais detalhadas',
        limitations: 'Mais eficaz para planetas massivos próximos à estrela',
        missions: 'HARPS, ESPRESSO, HIRES, APF',
        example: '51 Pegasi b, descoberto em 1995, foi o primeiro exoplaneta confirmado por este método'
      }
    },
    {
      id: 3,
      name: 'Microlente Gravitacional',
      nameEn: 'Gravitational Microlensing',
      icon: Zap,
      color: 'bg-purple-500',
      description: 'Amplificação da luz de uma estrela distante pela gravidade de um sistema planetário',
      percentage: '3%',
      discovered: '200+',
      details: {
        principle: 'A gravidade de uma estrela com planeta atua como lente, amplificando a luz de uma estrela mais distante que passa por trás.',
        advantages: 'Pode detectar planetas a grandes distâncias e planetas de baixa massa',
        limitations: 'Eventos são únicos e não repetitivos, dificultando confirmações',
        missions: 'OGLE, MOA, KMTNet, Nancy Grace Roman',
        example: 'OGLE-2005-BLG-390L b, uma super-Terra fría descoberta em 2006'
      }
    },
    {
      id: 4,
      name: 'Imagem Direta',
      nameEn: 'Direct Imaging',
      icon: Search,
      color: 'bg-red-500',
      description: 'Fotografia direta do planeta separando sua luz da luz ofuscante da estrela',
      percentage: '1%',
      discovered: '60+',
      details: {
        principle: 'Uso de coronarógrafos e óptica adaptativa para bloquear a luz estelar e fotografar diretamente o planeta.',
        advantages: 'Permite análise direta da atmosfera e composição planetária',
        limitations: 'Limitado a planetas jovens, quentes e distantes de suas estrelas',
        missions: 'VLT, Keck, Gemini, futuros HabEx e LUVOIR',
        example: 'HR 8799 bcde, sistema com quatro planetas gigantes fotografados diretamente'
      }
    }
  ];

  const recentDiscoveries = [
    {
      id: 1,
      name: 'TOI-715 b',
      type: 'Super-Terra',
      distance: '137 anos-luz',
      year: 2024,
      habitability: 'Zona Habitável',
      description: 'Super-Terra na zona habitável de uma anã vermelha',
      details: 'Planeta 1,5 vezes maior que a Terra, orbital período de 19 dias'
    },
    {
      id: 2,
      name: 'K2-18 b',
      type: 'Sub-Netuno',
      distance: '124 anos-luz',
      year: 2024,
      habitability: 'Vapor d’água detectado',
      description: 'Planeta com possível oceano sob atmosfera rica em hidrogênio',
      details: 'James Webb detectou vapor d’água e possíveis nuvens na atmosfera'
    },
    {
      id: 3,
      name: 'TRAPPIST-1 e',
      type: 'Terrestre',
      distance: '40 anos-luz',
      year: 2024,
      habitability: 'Potencialmente habitável',
      description: 'Um dos sete planetas rochosos do sistema TRAPPIST-1',
      details: 'Tamanho similar à Terra, dentro da zona habitável da estrela'
    },
    {
      id: 4,
      name: 'Proxima Centauri c',
      type: 'Super-Terra',
      distance: '4,2 anos-luz',
      year: 2024,
      habitability: 'Em estudo',
      description: 'Segundo planeta no sistema estelar mais próximo da Terra',
      details: 'Confirmação independente por vários grupos de pesquisa'
    }
  ];

  const statistics = [
    {
      number: '6.000+',
      label: 'Exoplanetas Confirmados',
      description: 'Total de planetas descobertos orbitando outras estrelas',
      icon: Globe
    },
    {
      number: '4.000+',
      label: 'Sistemas Planetários',
      description: 'Sistemas estelares com pelo menos um planeta confirmado',
      icon: Telescope
    },
    {
      number: '200+',
      label: 'Potencialmente Habitáveis',
      description: 'Planetas na zona habitável com condições favoráveis',
      icon: TrendingUp
    },
    {
      number: '30+',
      label: 'Atmosferas Analisadas',
      description: 'Planetas com composição atmosférica conhecida',
      icon: Eye
    }
  ];

  return (
    <section id="exoplanetas" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Exoplanetas: Mundos Além do Sistema Solar
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Descubra os métodos revolucionários usados para encontrar planetas em outras estrelas 
            e explore as descobertas mais recentes na busca por mundos habitáveis.
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {statistics.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6">
                  <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800 mb-2">{stat.number}</div>
                  <div className="text-lg font-semibold text-slate-700 mb-2">{stat.label}</div>
                  <p className="text-sm text-slate-600">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="methods" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Métodos de Detecção
            </TabsTrigger>
            <TabsTrigger value="discoveries" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Descobertas Recentes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="methods">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {detectionMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Dialog key={method.id}>
                    <DialogTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                        <CardContent className="p-6">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`p-4 ${method.color} rounded-full`}>
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-slate-800 mb-1">{method.name}</h3>
                              <p className="text-sm text-slate-600">{method.nameEn}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{method.percentage}</div>
                              <div className="text-sm text-slate-500">das descobertas</div>
                            </div>
                          </div>
                          
                          <p className="text-slate-700 mb-4">{method.description}</p>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">
                              {method.discovered} descobertos
                            </Badge>
                            <span className="text-sm text-blue-600 font-medium">
                              Clique para detalhes →
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`p-4 ${method.color} rounded-full`}>
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl">{method.name}</DialogTitle>
                            <p className="text-lg text-slate-600">{method.nameEn}</p>
                          </div>
                        </div>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <p className="text-lg text-slate-700">{method.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-slate-800 mb-2">Princípio Científico</h4>
                              <p className="text-sm text-slate-600">{method.details.principle}</p>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-green-800 mb-2">Vantagens</h4>
                              <p className="text-sm text-green-700">{method.details.advantages}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="bg-orange-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-orange-800 mb-2">Limitações</h4>
                              <p className="text-sm text-orange-700">{method.details.limitations}</p>
                            </div>
                            
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <h4 className="font-semibold text-blue-800 mb-2">Missões Principais</h4>
                              <p className="text-sm text-blue-700">{method.details.missions}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">Exemplo Histórico</h4>
                          <p className="text-sm text-purple-700">{method.details.example}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="discoveries">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentDiscoveries.map((planet) => (
                <Card key={planet.id} className="hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{planet.name}</h3>
                        <p className="text-sm text-slate-600">{planet.type}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {planet.year}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Distância:</span>
                        <span className="text-sm text-slate-800">{planet.distance}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Habitabilidade:</span>
                        <span className="text-sm text-slate-800">{planet.habitability}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 mb-4">{planet.description}</p>
                    
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-600">{planet.details}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-slate-800 mb-4">
                  O Futuro da Descoberta de Exoplanetas
                </h3>
                <p className="text-slate-600 max-w-3xl mx-auto mb-6">
                  Com o Telescópio James Webb e futuras missões como o Nancy Grace Roman Space Telescope, 
                  estamos entrando em uma nova era de descobertas. Em breve, poderemos detectar 
                  bioassinaturas em atmosferas de exoplanetas, respondendo à pergunta fundamental: 
                  estamos sozinhos no universo?
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Badge variant="outline" className="text-sm py-2 px-4">
                    Nancy Grace Roman (2027)
                  </Badge>
                  <Badge variant="outline" className="text-sm py-2 px-4">
                    Extremely Large Telescope (2028)
                  </Badge>
                  <Badge variant="outline" className="text-sm py-2 px-4">
                    HabEx / LUVOIR (2030s)
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ExoplanetsSection;
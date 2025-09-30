import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ExternalLink, Calendar, Users, Rocket, Globe } from 'lucide-react';

const NewsSection = () => {
  const news = [
    {
      id: 1,
      title: 'NASA Atinge Marco de 6.000 Exoplanetas Descobertos',
      summary: 'A humanidade oficialmente catalogou mais de 6.000 planetas orbitando outras estrelas, marcando um momento histórico na busca por mundos habitáveis.',
      date: '2025-07-15',
      category: 'Descoberta',
      icon: Globe,
      color: 'bg-blue-500',
      details: [
        'Mais de 4.000 descobertos pelo Telescópio Kepler',
        'TESS contribuiu com mais de 1.500 descobertas',
        'James Webb já analisou atmosferas de 30+ exoplanetas',
        'Próxima meta: encontrar bioassinaturas em atmosferas alienígenas'
      ],
      source: 'NASA Exoplanet Archive',
      readTime: '3 min'
    },
    {
      id: 2,
      title: 'Cometa Interestelar 3I/Atlas Fotografado no Brasil',
      summary: 'Astrônomos brasileiros capturaram imagens espetaculares do terceiro cometa interestelar conhecido, oferecendo pistas sobre a formação de sistemas planetários distantes.',
      date: '2025-07-10',
      category: 'Observação',
      icon: Rocket,
      color: 'bg-green-500',
      details: [
        'Observatório Nacional do Rio de Janeiro liderou as observações',
        'Cometa viaja a 50 km/s em relação ao Sol',
        'Composição química indica origem em sistema estelar jovem',
        'Colaboração internacional com ESA e NASA'
      ],
      source: 'Observatório Nacional',
      readTime: '4 min'
    },
    {
      id: 3,
      title: 'Descoberta Brasileira: Exoplaneta TOI-4562c',
      summary: 'Equipe da USP em parceria com NASA descobre exoplaneta potencialmente habitável usando dados do telescópio TESS, destacando o Brasil na astronomia mundial.',
      date: '2025-07-05',
      category: 'Pesquisa Nacional',
      icon: Users,
      color: 'bg-yellow-500',
      details: [
        'Liderado pelo Prof. Dr. Sylvio Ferraz-Mello (USP)',
        'Planeta rochoso 1,3 vezes o tamanho da Terra',
        'Localizado na zona habitável de estrela tipo K',
        'Distância: 186 anos-luz na constelação de Touro'
      ],
      source: 'Universidade de São Paulo',
      readTime: '5 min'
    },
    {
      id: 4,
      title: 'James Webb Revela Atmosfera Rica em Vapor d’Água em K2-18 b',
      summary: 'Telescópio James Webb detecta vapor d’água e possíveis nuvens na atmosfera do exoplaneta K2-18 b, aumentando esperanças de habitabilidade.',
      date: '2025-06-28',
      category: 'Astrobiologia',
      icon: Globe,
      color: 'bg-cyan-500',
      details: [
        'Primeiro exoplaneta sub-Netuno com vapor d’água confirmado',
        'Possíveis nuvens de água detectadas na atmosfera',
        'Temperatura permite água líquida na superfície',
        'Novos alvos selecionados para observações futuras'
      ],
      source: 'NASA/ESA/STScI',
      readTime: '6 min'
    },
    {
      id: 5,
      title: 'Perseverance Coleta 20ª Amostra de Rocha Marciana',
      summary: 'O rover Perseverance atingiu um marco importante ao coletar sua 20ª amostra de rocha marciana, que será devolvida à Terra em missão futura.',
      date: '2025-06-20',
      category: 'Missão Espacial',
      icon: Rocket,
      color: 'bg-red-500',
      details: [
        'Amostras coletadas na região "Bright Angel" da cratera Jezero',
        'Evidências de atividade hidrotermal antiga',
        'Missão Mars Sample Return planejada para 2030',
        'Helicóptero Ingenuity completa 70º voo'
      ],
      source: 'NASA JPL',
      readTime: '4 min'
    },
    {
      id: 6,
      title: 'Ativação de Instrumentos do Telescópio Roman',
      summary: 'NASA inicia testes dos instrumentos do Telescópio Nancy Grace Roman, que revolucionará a busca por exoplanetas e estudo da energia escura.',
      date: '2025-06-15',
      category: 'Tecnologia',
      icon: Users,
      color: 'bg-purple-500',
      details: [
        'Campo de visão 100 vezes maior que o Hubble',
        'Lançamento programado para maio de 2027',
        'Primeira missão dedicada à energia escura',
        'Detectará milhares de novos exoplanetas por microlente'
      ],
      source: 'NASA Goddard',
      readTime: '3 min'
    }
  ];

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'há 1 dia';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.ceil(diffDays / 7)} semana${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <section id="noticias" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Notícias Recentes
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Mantenha-se atualizado com as últimas descobertas, missões e avanços 
            da exploração espacial mundial, incluindo contribuições brasileiras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article) => {
            const IconComponent = article.icon;
            return (
              <Card key={article.id} className="h-full hover:shadow-lg transition-all duration-300 transform hover:scale-105 group">
                <CardContent className="p-6 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 ${article.color} rounded-full group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <Badge 
                        variant="outline" 
                        className="mb-2 text-xs"
                      >
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{getTimeAgo(article.date)}</span>
                        <span>•</span>
                        <span>{article.readTime} leitura</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {article.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-4 line-clamp-3">
                      {article.summary}
                    </p>
                    
                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {article.details.slice(0, 2).map((detail, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-slate-600">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-sm text-slate-500">{article.source}</span>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      Ler mais
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">
            Receba as Últimas Notícias Espaciais
          </h3>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Inscreva-se em nossa newsletter para receber semanalmente as descobertas 
            mais importantes da astronomia e exploração espacial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Seu e-mail"
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button className="bg-blue-600 hover:bg-blue-700">
              Inscrever-se
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Livre de spam. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
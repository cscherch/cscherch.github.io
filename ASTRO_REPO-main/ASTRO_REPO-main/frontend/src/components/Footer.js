import React from 'react';
import { Telescope, Mail, ExternalLink, Globe, Github, Twitter } from 'lucide-react';
import { Button } from './ui/button';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Exploração',
      links: [
        { name: 'Planetas', href: '#planetas' },
        { name: 'Timeline Espacial', href: '#timeline' },
        { name: 'Instrumentos', href: '#instrumentos' },
        { name: 'Exoplanetas', href: '#exoplanetas' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Galeria de Imagens', href: '#galeria' },
        { name: 'Notícias', href: '#noticias' },
        { name: 'Dados da NASA', href: 'https://api.nasa.gov', external: true },
        { name: 'ESA Portal', href: 'https://www.esa.int', external: true }
      ]
    },
    {
      title: 'Educação',
      links: [
        { name: 'Material Didático', href: '#educacao' },
        { name: 'Atividades', href: '#atividades' },
        { name: 'Para Professores', href: '#professores' },
        { name: 'Astronomia para Crianças', href: '#criancas' }
      ]
    },
    {
      title: 'Sobre',
      links: [
        { name: 'Nossa Missão', href: '#missao' },
        { name: 'Equipe', href: '#equipe' },
        { name: 'Contato', href: '#contato' },
        { name: 'Colaborações', href: '#colaboracoes' }
      ]
    }
  ];

  const scrollToSection = (href) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Telescope className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Sistema Solar</h3>
                <p className="text-sm text-slate-400">Explorer</p>
              </div>
            </div>
            <p className="text-slate-400 mb-6 leading-relaxed">
              Plataforma educativa brasileira dedicada à exploração do cosmos 
              através de dados científicos autênticos da NASA e ESA.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-3">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                      >
                        {link.name}
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </a>
                    ) : (
                      <button
                        onClick={() => scrollToSection(link.href)}
                        className="text-slate-400 hover:text-white transition-colors duration-200 text-left"
                      >
                        {link.name}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Credits Section */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Data Sources */}
            <div>
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Fontes de Dados
              </h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  <strong className="text-white">NASA:</strong> National Aeronautics and Space Administration
                </p>
                <p>
                  <strong className="text-white">ESA:</strong> European Space Agency
                </p>
                <p>
                  <strong className="text-white">JPL:</strong> Jet Propulsion Laboratory
                </p>
                <p>
                  <strong className="text-white">Exoplanet Archive:</strong> NASA Exoplanet Science Institute
                </p>
              </div>
            </div>

            {/* Educational Purpose */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Propósito Educacional</h4>
              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  Esta plataforma foi desenvolvida exclusivamente para fins educacionais, 
                  utilizando dados públicos e imagens oficiais das agências espaciais.
                </p>
                <p>
                  Nosso objetivo é democratizar o acesso ao conhecimento científico 
                  e inspirar as próximas gerações de exploradores espaciais brasileiros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              © {currentYear} Sistema Solar Explorer. 
              Desenvolvido com ❤️ para a educação brasileira.
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <button className="hover:text-white transition-colors duration-200">
                Política de Privacidade
              </button>
              <button className="hover:text-white transition-colors duration-200">
                Termos de Uso
              </button>
              <button className="hover:text-white transition-colors duration-200">
                Créditos
              </button>
            </div>
          </div>
          
          {/* Attribution */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Imagens e dados fornecidos por NASA, ESA, JPL, Hubble Space Telescope, 
              James Webb Space Telescope e suas respectivas equipes científicas.
              <br />
              Todos os créditos pertençam aos seus respectivos proprietários.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
# Canoas City

Jogo 3D de mundo aberto no navegador, ambientado em **Canoas, RS**. Feito em three.js, sem build: é só abrir `index.html` por um servidor web (ex.: GitHub Pages).

**Jogar:** https://cscherch.github.io/canoas-city/

## O que tem
- **A cidade de Canoas**: BR-116 e BR-386, linha do Trensurb com 6 estações (Niterói, Fátima, Canoas, Mathias Velho, São Luís, Petrobras) e trens circulando, avenidas reais (Guilherme Schell, Getúlio Vargas, Santos Ferreira, Victor Barreto, Inconfidência, Farroupilha, Boqueirão, Dr. Sezefredo Vieira, 17 de Abril…), 16 bairros com malha de ruas própria, Rio dos Sinos e Rio Gravataí com pontes.
- **Pontos de referência**: Base Aérea (pista, hangares, aviões), REFAP (tanques e tocha), ULBRA e Hospital Universitário, ParkShopping Canoas (com estacionamento), Canoas Shopping, Praça da Bandeira (com a bandeira do RS), Estádio Municipal, parques.
- **Jogabilidade**: andar a pé, entrar em carros estacionados ou "pegar" carros do trânsito, física arcade com freio de mão/drift, dano e fumaça, trânsito com IA, pedestres, buzina.
- **Missões**: Táxi Canoas, Tele-Xis (entregas), Rally da BR-116 (com recorde), Tour de Canoas e 30 cuias de chimarrão para coletar. Dinheiro salvo no navegador.
- **Gráficos**: ciclo dia/noite com céu, sol, lua e estrelas; sombras; bloom; janelas que acendem à noite; faróis; água animada com reflexo; ipês floridos; casas com telhado; neblina; FOV dinâmico.
- **HUD**: minimapa giratório, mapa completo (M) com bairros e pontos, velocímetro, nome do bairro e da rua.
- Controles de toque em celular.

## Controles
WASD/setas · mouse (câmera) · F entrar/sair · Espaço freio de mão/pular · Shift correr · H buzina · M mapa · C câmera · roda do mouse zoom · R voltar à rua · N +3 horas · Q qualidade · P pausa · K som · X cancela missão

## Sobre o mapa
O Google Maps não permite baixar e redistribuir os dados do mapa, então o jogo trabalha com duas fontes:

1. **Embutida (padrão)** – `js/data.js`: limite do município, rios, rodovias, avenidas, linha do Trensurb, bairros e pontos de referência em coordenadas lat/lon aproximadas. As ruas de cada bairro e os prédios são gerados a partir disso. A geografia geral é fiel; o traçado rua a rua não é.
2. **OpenStreetMap (dados reais)** – rode, numa máquina com internet:
   ```
   python3 tools/fetch_canoas_osm.py          # ruas + prédios + água + parques
   python3 tools/fetch_canoas_osm.py --no-buildings   # arquivo menor
   ```
   Isso cria `data/canoas-osm.json`; o jogo detecta o arquivo e passa a usar cada rua e cada prédio reais de Canoas (crédito: © OpenStreetMap, ODbL).

## Estrutura
- `js/data.js` – geografia de Canoas · `js/world.js` – geração do mundo e colisão · `js/render.js` – malhas, materiais e shaders
- `js/vehicles.js` – carros, trânsito e trem · `js/people.js` – jogador e pedestres · `js/missions.js` – missões
- `js/sky.js` – dia/noite · `js/hud.js` – minimapa e mapa · `js/audio.js` – sons procedurais · `js/main.js` – loop do jogo
- `vendor/` – three.js r169 (licença MIT)

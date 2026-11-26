# Canoas City 3D (Godot 4)

Jogo de mundo aberto em **Canoas, RS**, feito em Godot 4.3, com o **mapa real** da cidade.

## Jogar
- **Windows:** baixe `downloads/CanoasCity-Windows.zip`, descompacte e abra `CanoasCity.exe` (os dois arquivos precisam ficar na mesma pasta). Se o Windows avisar, clique em "Mais informações" → "Executar assim mesmo".
- **Navegador:** https://cscherch.github.io/canoas-city-3d/ (versão Web, gráficos simplificados; abre melhor no Chrome/Edge no PC).

## Controles
| Tecla | Ação |
|---|---|
| W A S D / setas | andar / acelerar, frear, virar |
| Mouse | câmera |
| F | entrar / sair / "pegar" carro do trânsito |
| Espaço | freio de mão (drift) / pular |
| Shift | correr |
| H | buzina |
| M | mapa de Canoas |
| C | câmera perto / longe |
| R | desvirar o carro |
| N | avançar 3 horas |
| Q | gráficos altos / rápidos |
| X | cancelar missão |
| P ou Esc | pausa |

Controle de Xbox/PlayStation também funciona (gatilhos aceleram e freiam).

## O que tem
- **Mapa real:** 17 mil trechos de rua com os nomes de verdade, 152 mil prédios com a planta real (contornos do OpenStreetMap e do Microsoft ML Buildings via Overture Maps), rios dos Sinos e Gravataí, parques, a linha do Trensurb, a Base Aérea, os bairros oficiais e mais de 2 mil pontos de interesse reais (Canoas Shopping, ParkShopping, ULBRA, estações etc.). A altura de cada prédio é estimada, porque quase nenhum prédio de Canoas tem altura cadastrada.
- **Carros brasileiros** (nomes paródia): Fuskinha 1300, Gol Quadrado, Unu Mile, Opalão Diplomata, Kombão, Onyks Turbo, Estradeira CS, Táxi Canoas, Viatura BM e Ônibus Canoense, todos com placa Mercosul do RS. Física de suspensão, tração dianteira ou traseira conforme o modelo, freio de mão com drift e dano.
- **Trânsito com IA** seguindo as ruas reais e respeitando a mão única, além de **pedestres** nas calçadas.
- **Missões:** Táxi Canoas, Tele-Xis, Rally da BR-116 e Tour de Canoas, mais 30 cuias de chimarrão espalhadas pela cidade. Tudo com gírias gaúchas.
- **Gráficos:** materiais PBR (texturas CC0 do Poly Haven), céu com nuvens, ciclo de dia e noite, janelas acesas à noite, faróis, sombras, SSAO e glow.

## Mapa: como regenerar
```
pip install overturemaps shapely mapbox_earcut zstandard pillow numpy
BBOX=-51.255,-29.985,-51.070,-29.845
for t in building segment water land_use land_cover place infrastructure division_area; do
  overturemaps download --bbox=$BBOX -f geojson --type=$t -o dados/${t/building/buildings}.geojson; done
python3 tools/build_map.py dados map
```

## Créditos
Dados do mapa © OpenStreetMap contributors (ODbL), Overture Maps Foundation, Microsoft ML Buildings (ODbL). Texturas: Poly Haven (CC0). Engine: Godot 4.3 (MIT).

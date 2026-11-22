// Dados geográficos de Canoas/RS (coordenadas [lat, lon] aproximadas).
// Usados para gerar a cidade quando não há extrato do OpenStreetMap em data/canoas-osm.json.
// Para usar dados reais de ruas e prédios rode: python3 tools/fetch_canoas_osm.py

export const ORIGIN = { lat: -29.915, lon: -51.175 };
export const SCALE = 0.7; // unidades do jogo por metro real

// Limite aproximado do município
export const BOUNDARY = [
  [-29.858, -51.214], [-29.857, -51.185], [-29.858, -51.160], [-29.866, -51.135],
  [-29.878, -51.105], [-29.900, -51.088], [-29.925, -51.093], [-29.945, -51.108],
  [-29.957, -51.128], [-29.963, -51.150], [-29.966, -51.172], [-29.963, -51.193],
  [-29.950, -51.212], [-29.930, -51.228], [-29.905, -51.236], [-29.882, -51.232],
  [-29.866, -51.224],
];

// Rios (polilinhas com largura em metros)
export const RIVERS = [
  { name: 'Rio dos Sinos', width: 140, pts: [
    [-29.835, -51.150], [-29.846, -51.170], [-29.852, -51.190], [-29.855, -51.212],
    [-29.866, -51.231], [-29.882, -51.240], [-29.905, -51.244], [-29.930, -51.236],
    [-29.950, -51.222], [-29.965, -51.214], [-29.985, -51.222],
  ]},
  { name: 'Rio Gravataí', width: 110, pts: [
    [-29.938, -51.060], [-29.948, -51.085], [-29.954, -51.108], [-29.962, -51.128],
    [-29.968, -51.150], [-29.971, -51.172], [-29.969, -51.193], [-29.968, -51.214],
  ]},
  { name: 'Arroio Sapucaia', width: 30, pts: [
    [-29.840, -51.120], [-29.852, -51.135], [-29.860, -51.150], [-29.858, -51.160],
  ]},
];

// Vias principais: type = highway | avenue | road
export const ROADS = [
  { name: 'BR-116', type: 'highway', pts: [
    [-29.990, -51.168], [-29.970, -51.172], [-29.950, -51.176], [-29.930, -51.1785],
    [-29.915, -51.1795], [-29.895, -51.1775], [-29.878, -51.172], [-29.858, -51.165], [-29.835, -51.158],
  ]},
  { name: 'BR-386', type: 'highway', pts: [
    [-29.878, -51.172], [-29.871, -51.188], [-29.864, -51.205], [-29.857, -51.225], [-29.850, -51.245],
  ]},
  { name: 'Av. Guilherme Schell', type: 'avenue', pts: [
    [-29.958, -51.1835], [-29.945, -51.1855], [-29.930, -51.1875], [-29.915, -51.1885],
    [-29.900, -51.1870], [-29.888, -51.1830], [-29.880, -51.1795],
  ]},
  { name: 'Av. Getúlio Vargas', type: 'avenue', pts: [
    [-29.962, -51.1690], [-29.950, -51.1720], [-29.935, -51.1745], [-29.920, -51.1757],
    [-29.905, -51.1748], [-29.895, -51.1735],
  ]},
  { name: 'Av. Santos Ferreira', type: 'avenue', pts: [
    [-29.9135, -51.1880], [-29.9120, -51.1960], [-29.9105, -51.2050], [-29.9095, -51.2150], [-29.9085, -51.2260],
  ]},
  { name: 'Av. Victor Barreto', type: 'avenue', pts: [
    [-29.9172, -51.1885], [-29.9170, -51.1795], [-29.9165, -51.1700], [-29.9160, -51.1620],
  ]},
  { name: 'Av. Inconfidência', type: 'avenue', pts: [
    [-29.9230, -51.1785], [-29.9228, -51.1700], [-29.9222, -51.1600], [-29.9215, -51.1480], [-29.9205, -51.1380],
  ]},
  { name: 'Av. Farroupilha', type: 'avenue', pts: [
    [-29.9380, -51.1765], [-29.9330, -51.1680], [-29.9290, -51.1600], [-29.9250, -51.1500],
    [-29.9215, -51.1400], [-29.9180, -51.1280], [-29.9150, -51.1150], [-29.9120, -51.0950],
  ]},
  { name: 'Av. Boqueirão', type: 'avenue', pts: [
    [-29.9480, -51.1600], [-29.9350, -51.1585], [-29.9200, -51.1575], [-29.9050, -51.1555],
    [-29.8920, -51.1530], [-29.8780, -51.1470], [-29.8680, -51.1400],
  ]},
  { name: 'Av. Dr. Sezefredo Vieira', type: 'avenue', pts: [
    [-29.9050, -51.1745], [-29.9045, -51.1650], [-29.9040, -51.1555], [-29.9020, -51.1400],
    [-29.9000, -51.1250], [-29.8975, -51.1100], [-29.8950, -51.0950],
  ]},
  { name: 'Av. 17 de Abril', type: 'avenue', pts: [
    [-29.9180, -51.1240], [-29.9080, -51.1225], [-29.8980, -51.1205], [-29.8870, -51.1185], [-29.8770, -51.1150],
  ]},
  { name: 'Av. Rio Grande do Sul', type: 'avenue', pts: [
    [-29.9300, -51.2080], [-29.9200, -51.2095], [-29.9100, -51.2110], [-29.9000, -51.2120], [-29.8880, -51.2110],
  ]},
  { name: 'Av. Irineu Carvalho de Braga', type: 'avenue', pts: [
    [-29.9330, -51.1880], [-29.9320, -51.1980], [-29.9300, -51.2080], [-29.9270, -51.2200],
  ]},
  { name: 'Rua Mathias Velho', type: 'road', pts: [
    [-29.9000, -51.1870], [-29.9000, -51.1980], [-29.9000, -51.2120], [-29.8990, -51.2250],
  ]},
  { name: 'Av. Brasil', type: 'road', pts: [
    [-29.8900, -51.1830], [-29.8880, -51.1950], [-29.8870, -51.2080], [-29.8850, -51.2200],
  ]},
  { name: 'Rua Araçá', type: 'road', pts: [
    [-29.8950, -51.1735], [-29.8850, -51.1660], [-29.8790, -51.1560], [-29.8760, -51.1470],
  ]},
  { name: 'Av. Açucena', type: 'road', pts: [
    [-29.9420, -51.1760], [-29.9420, -51.1650], [-29.9415, -51.1600],
  ]},
  { name: 'Rua Ipiranga', type: 'road', pts: [
    [-29.9250, -51.1882], [-29.9250, -51.1980], [-29.9240, -51.2100],
  ]},
];

export const RAIL = { name: 'Trensurb', pts: [
  [-29.990, -51.1720], [-29.970, -51.1760], [-29.950, -51.1800], [-29.930, -51.1828],
  [-29.915, -51.1838], [-29.895, -51.1817], [-29.878, -51.1760], [-29.858, -51.1690], [-29.835, -51.1610],
]};

export const STATIONS = [
  { name: 'Estação Niterói', lat: -29.9480 },
  { name: 'Estação Fátima', lat: -29.9330 },
  { name: 'Estação Canoas', lat: -29.9180 },
  { name: 'Estação Mathias Velho', lat: -29.9050 },
  { name: 'Estação São Luís', lat: -29.8930 },
  { name: 'Estação Petrobras', lat: -29.8790 },
];

// Bairros: centro, ângulo da malha (graus), quarteirão (m), densidade (0..1 -> altura)
export const NEIGHBORHOODS = [
  { name: 'Centro', lat: -29.9170, lon: -51.1835, angle: 4, block: 95, density: 1.0 },
  { name: 'Nossa Sra. das Graças', lat: -29.9070, lon: -51.1790, angle: 6, block: 110, density: 0.55 },
  { name: 'Marechal Rondon', lat: -29.9260, lon: -51.1680, angle: -20, block: 110, density: 0.55 },
  { name: 'Niterói', lat: -29.9470, lon: -51.1700, angle: 10, block: 105, density: 0.4 },
  { name: 'Fátima', lat: -29.9340, lon: -51.1930, angle: 8, block: 100, density: 0.35 },
  { name: 'Rio Branco', lat: -29.9450, lon: -51.1940, angle: 25, block: 105, density: 0.35 },
  { name: 'Mathias Velho', lat: -29.9100, lon: -51.2080, angle: 12, block: 90, density: 0.25 },
  { name: 'Harmonia', lat: -29.8930, lon: -51.2080, angle: -12, block: 95, density: 0.22 },
  { name: 'São Luís', lat: -29.8930, lon: -51.1880, angle: 18, block: 100, density: 0.3 },
  { name: 'Mato Grande', lat: -29.8820, lon: -51.1620, angle: -25, block: 115, density: 0.28 },
  { name: 'Igara', lat: -29.9030, lon: -51.1630, angle: 0, block: 110, density: 0.4 },
  { name: 'Estância Velha', lat: -29.9180, lon: -51.1520, angle: -8, block: 105, density: 0.3 },
  { name: 'São José', lat: -29.9280, lon: -51.1320, angle: 15, block: 110, density: 0.3 },
  { name: 'Guajuviras', lat: -29.9000, lon: -51.1230, angle: 30, block: 85, density: 0.22 },
  { name: 'Olaria', lat: -29.8830, lon: -51.1270, angle: 5, block: 100, density: 0.22 },
  { name: 'Brigadeira', lat: -29.9380, lon: -51.1500, angle: -15, block: 110, density: 0.3 },
];

// Áreas especiais (retângulos em metros, rotação em graus). kind define o visual.
export const AREAS = [
  { name: 'Base Aérea de Canoas', kind: 'airbase', lat: -29.9450, lon: -51.1430, w: 3000, h: 1100, angle: -20 },
  { name: 'Refinaria Alberto Pasqualini (REFAP)', kind: 'refinery', lat: -29.8720, lon: -51.1600, w: 1300, h: 900, angle: -20 },
  { name: 'ULBRA', kind: 'campus', lat: -29.9205, lon: -51.1440, w: 650, h: 520, angle: -15 },
  { name: 'ParkShopping Canoas', kind: 'mall', lat: -29.9295, lon: -51.1655, w: 380, h: 260, angle: -25 },
  { name: 'Canoas Shopping', kind: 'mall2', lat: -29.9158, lon: -51.1865, w: 170, h: 120, angle: 4 },
  { name: 'Parque Getúlio Vargas', kind: 'park', lat: -29.9100, lon: -51.1660, w: 300, h: 260, angle: 0 },
  { name: 'Parque Eduardo Gomes', kind: 'park', lat: -29.8960, lon: -51.1980, w: 260, h: 200, angle: 12 },
  { name: 'Praça da Bandeira', kind: 'plaza', lat: -29.9188, lon: -51.1855, w: 90, h: 70, angle: 4 },
  { name: 'Arena / Estádio Municipal', kind: 'stadium', lat: -29.9045, lon: -51.1915, w: 200, h: 150, angle: 18 },
  { name: 'Parque Natural do Delta', kind: 'wetland', lat: -29.9300, lon: -51.2200, w: 700, h: 300, angle: 40 },
];

// Pontos de referência usados em missões e no mapa
export const LANDMARKS = [
  { name: 'Canoas Shopping', lat: -29.9158, lon: -51.1865 },
  { name: 'Estação Canoas (Trensurb)', lat: -29.9180, lon: -51.1815 },
  { name: 'Prefeitura de Canoas', lat: -29.9205, lon: -51.1870 },
  { name: 'Catedral São Luiz Gonzaga', lat: -29.9135, lon: -51.1855 },
  { name: 'Unilasalle', lat: -29.9150, lon: -51.1745 },
  { name: 'ParkShopping Canoas', lat: -29.9295, lon: -51.1655 },
  { name: 'ULBRA', lat: -29.9205, lon: -51.1440 },
  { name: 'Hospital Universitário', lat: -29.9165, lon: -51.1390 },
  { name: 'Base Aérea de Canoas', lat: -29.9400, lon: -51.1550 },
  { name: 'REFAP', lat: -29.8760, lon: -51.1530 },
  { name: 'Praça da Bandeira', lat: -29.9188, lon: -51.1855 },
  { name: 'Parque Getúlio Vargas', lat: -29.9100, lon: -51.1660 },
  { name: 'Mathias Velho', lat: -29.9100, lon: -51.2080 },
  { name: 'Guajuviras', lat: -29.9000, lon: -51.1230 },
  { name: 'Estação Niterói', lat: -29.9480, lon: -51.1790 },
  { name: 'Ponte do Rio Gravataí', lat: -29.9690, lon: -51.1725 },
  { name: 'Estádio Municipal', lat: -29.9045, lon: -51.1915 },
  { name: 'Harmonia', lat: -29.8930, lon: -51.2080 },
];

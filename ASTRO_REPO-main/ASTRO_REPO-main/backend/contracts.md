# Sistema Solar Explorer - Contratos de API

## Visão Geral
Este documento define os contratos de API entre o frontend React e o backend FastAPI para o Sistema Solar Explorer, uma plataforma educativa brasileira que utiliza dados em tempo real da NASA e ESA.

## Estrutura de URLs
- **Base URL**: `${process.env.REACT_APP_BACKEND_URL}/api`
- **Prefixo obrigatório**: Todas as rotas do backend devem usar `/api` para compatibilidade com Kubernetes ingress

## 1. Planetas

### GET /api/planetas
**Descrição**: Retorna lista de todos os planetas do Sistema Solar
**Frontend Mock**: `mockPlanets` em `mockData.js`
**Response**:
```json
{
  "planets": [
    {
      "id": "399",
      "name": "Earth",
      "name_pt": "Terra",
      "diameter_km": 12756,
      "mass_kg": 5.97e24,
      "distance_au": 1.0,
      "temperature_k": 288,
      "moons_count": 1,
      "orbital_period_days": 365.25,
      "interesting_facts": [...],
      "missions": [...],
      "structure": {...}
    }
  ]
}
```

### GET /api/planetas/{planet_id}
**Descrição**: Retorna dados detalhados de um planeta específico
**Integração NASA**: Horizons API para dados físicos e posicionais
**Response**: Objeto Planet completo

### GET /api/planetas/{planet_id}/posicao
**Descrição**: Retorna posição atual do planeta
**Integração NASA**: Horizons API ephemeris
**Response**:
```json
{
  "planet_id": "399",
  "date": "2025-07-15T12:00:00Z",
  "right_ascension_deg": 123.45,
  "declination_deg": -12.34,
  "distance_au": 1.016,
  "constellation": "Gemini"
}
```

## 2. Imagens Astronômicas

### GET /api/imagens/apod
**Descrição**: Astronomy Picture of the Day
**Frontend Mock**: `mockAPOD` em `mockData.js`
**Integração NASA**: APOD API
**Query Params**:
- `date` (opcional): YYYY-MM-DD
- `hd` (opcional): boolean
**Response**:
```json
{
  "title": "Amazing Galaxy",
  "title_pt": "Galáxia Incrível",
  "date": "2025-07-15",
  "url": "https://...",
  "hd_url": "https://...",
  "explanation": "...",
  "explanation_pt": "...",
  "media_type": "image"
}
```

### GET /api/imagens/marte
**Descrição**: Fotos recentes de Marte pelos rovers
**Frontend Mock**: `mockMarsPhotos` em `mockData.js`
**Integração NASA**: Mars Rover Photos API
**Query Params**:
- `sol`: número do dia marciano
- `camera`: tipo de câmera
**Response**:
```json
{
  "photos": [
    {
      "id": 12345,
      "sol": 1000,
      "img_src": "https://...",
      "earth_date": "2025-07-15",
      "camera": {...},
      "rover": {...},
      "description_pt": "..."
    }
  ]
}
```

### GET /api/imagens/galeria
**Descrição**: Galeria de imagens por categoria
**Frontend Mock**: `mockGalleryImages` em `mockData.js`
**Query Params**:
- `category`: nebulae, galaxies, solar_system, instruments
- `page`: número da página
- `per_page`: itens por página

## 3. Missões Espaciais

### GET /api/missoes
**Descrição**: Lista de missões espaciais históricas e atuais
**Frontend Mock**: `mockMissions` em `mockData.js`
**Response**:
```json
{
  "missions": [
    {
      "id": "apollo-11",
      "name": "Apollo 11",
      "name_pt": "Apollo 11",
      "agency": "NASA",
      "launch_date": "1969-07-16",
      "status": "completed",
      "target": "Moon",
      "description": "...",
      "major_achievements": [...]
    }
  ]
}
```

### GET /api/timeline
**Descrição**: Eventos da timeline de exploração espacial
**Frontend Mock**: `mockTimelineEvents` em `mockData.js`
**Response**: Array de TimelineEvent

## 4. Exoplanetas

### GET /api/exoplanetas/recentes
**Descrição**: Exoplanetas descobertos recentemente
**Frontend Mock**: `mockExoplanets` em `mockData.js`
**Integração NASA**: Exoplanet Archive TAP API
**Query Params**:
- `limit`: número máximo de resultados
- `habitable_only`: boolean
**Response**:
```json
{
  "exoplanets": [
    {
      "planet_name": "TOI-715 b",
      "host_star": "TOI-715",
      "discovery_year": 2024,
      "discovery_method": "transit",
      "planet_radius": 1.5,
      "distance_ly": 137,
      "potentially_habitable": true
    }
  ]
}
```

### GET /api/exoplanetas/estatisticas
**Descrição**: Estatísticas de descobertas de exoplanetas
**Integração NASA**: Exoplanet Archive queries
**Response**:
```json
{
  "total_confirmed": 6000,
  "by_discovery_method": {...},
  "discoveries_by_year": {...},
  "potentially_habitable_count": 200
}
```

### GET /api/exoplanetas/metodos
**Descrição**: Métodos de detecção de exoplanetas
**Frontend Mock**: `mockDetectionMethods` em `mockData.js`
**Response**: Array de DetectionMethod

## 5. Objetos Próximos à Terra (NEO)

### GET /api/neo
**Descrição**: Objetos próximos à Terra
**Integração NASA**: NeoWs API
**Query Params**:
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `hazardous_only`: boolean
**Response**:
```json
{
  "near_earth_objects": [
    {
      "name": "(2025 AB)",
      "diameter_km": 0.5,
      "close_approach_date": "2025-07-20",
      "miss_distance_km": 1000000,
      "potentially_hazardous": false
    }
  ]
}
```

## 6. Instrumentos Científicos

### GET /api/instrumentos
**Descrição**: Telescópios, rovers e bases de lançamento
**Frontend Mock**: `mockInstruments` em `mockData.js`
**Query Params**:
- `type`: telescopes, rovers, launch_sites
**Response**: Array de objetos de instrumento

## 7. Notícias

### GET /api/noticias
**Descrição**: Notícias recentes sobre exploração espacial
**Frontend Mock**: `mockNews` em `mockData.js`
**Integração**: NASA RSS feeds e APIs de notícias
**Response**:
```json
{
  "news": [
    {
      "id": "news-1",
      "title": "NASA Reaches 6,000 Exoplanets",
      "title_pt": "NASA Atinge 6.000 Exoplanetas",
      "summary": "...",
      "date": "2025-07-15",
      "category": "Discovery",
      "source": "NASA"
    }
  ]
}
```

## 8. Cache e Performance

### Estratégia de Cache
- **APOD**: 6 horas (muda diariamente)
- **Mars Photos**: 24 horas (dados históricos)
- **Planetary Positions**: 2 horas (mudança gradual)
- **Exoplanet Data**: 1 semana (dados relativamente estáticos)
- **News**: 1 hora (atualizações frequentes)

### Rate Limiting
- NASA API: 1000 requests/hour com API key
- Implementar rate limiting interno para prevenir sobrecarga

## 9. Tratamento de Erros

### Códigos de Erro Padrão
```json
{
  "error": "Descrição do erro em português",
  "code": 404,
  "help": "Sugestão de solução educacional",
  "timestamp": "2025-07-15T12:00:00Z"
}
```

### Fallbacks
- Se NASA API estiver indisponível, retornar dados cacheados
- Mensagens de erro educacionais em português
- Graceful degradation para funcionalidades não críticas

## 10. Integração Frontend-Backend

### Substituição de Mocks
1. Remover imports de `mockData.js`
2. Implementar chamadas HTTP usando axios
3. Adicionar loading states e error handling
4. Implementar cache do lado do cliente quando apropriado

### Configuração de Ambiente
- `REACT_APP_BACKEND_URL` já configurado no frontend
- Todas as chamadas devem usar: `${REACT_APP_BACKEND_URL}/api/endpoint`

### Estados de Loading
- Implementar skeletons para carregamento
- Error boundaries para falhas de API
- Retry mechanisms para requests falhados

## 11. Dados de Tradução

### Campos Traduzidos
- Todos os campos `*_pt` devem ser populados
- Fallback para versão em inglês se tradução não disponível
- Glossário de termos astronômicos em português

### Localização
- Datas em formato brasileiro (DD/MM/YYYY)
- Números com separadores brasileiros
- Unidades métricas preferenciais

Este contrato serve como guia para implementação do backend e integração com o frontend existente, garantindo uma experiência educacional rica e responsiva para os usuários brasileiros.
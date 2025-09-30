from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging

from ..services.nasa_service import NASAService, HorizonsService, ExoplanetService
from ..models.astronomical_image import AstronomicalImage, MarsPhoto
from ..models.planet import Planet, PlanetPosition
from ..models.exoplanet import Exoplanet, ExoplanetStatistics
from ..models.space_mission import SpaceMission, TimelineEvent

logger = logging.getLogger(__name__)

# Criar router com prefixo /api
api_router = APIRouter(prefix="/api")

# Instâncias globais dos serviços
nasa_service = NASAService()
horizons_service = HorizonsService()
exoplanet_service = ExoplanetService()

# Dependencies
async def get_nasa_service() -> NASAService:
    return nasa_service

async def get_horizons_service() -> HorizonsService:
    return horizons_service

async def get_exoplanet_service() -> ExoplanetService:
    return exoplanet_service

# ==================== ROTAS DE IMAGENS ====================

@api_router.get("/imagens/apod", response_model=AstronomicalImage,
         summary="Imagem Astronômica do Dia",
         description="Obter a imagem astronômica do dia da NASA")
async def get_apod(
    date: Optional[str] = Query(None, description="Data específica (YYYY-MM-DD)"),
    hd: bool = Query(False, description="Versão em alta definição"),
    service: NASAService = Depends(get_nasa_service)
):
    """Endpoint para APOD (Astronomy Picture of the Day)"""
    try:
        return await service.get_apod(date=date, hd=hd)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado no APOD: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@api_router.get("/imagens/marte", response_model=List[MarsPhoto],
         summary="Fotos de Marte",
         description="Fotos recentes dos rovers em Marte")
async def get_mars_photos(
    sol: int = Query(1000, description="Sol marciano (dia marciano)"),
    camera: str = Query("FHAZ", description="Tipo de câmera"),
    service: NASAService = Depends(get_nasa_service)
):
    """Endpoint para fotos de Marte"""
    try:
        return await service.get_mars_photos(sol=sol, camera=camera)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro nas fotos de Marte: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar fotos de Marte")

# ==================== ROTAS DE PLANETAS ====================

@api_router.get("/planetas", response_model=Dict[str, List[Planet]],
         summary="Lista de Planetas",
         description="Obter todos os planetas do Sistema Solar")
async def get_planets(
    service: HorizonsService = Depends(get_horizons_service)
):
    """Endpoint para lista de planetas"""
    try:
        # IDs dos planetas no sistema Horizons
        planet_ids = ['199', '299', '399', '499', '599', '699', '799', '899']
        planets = []
        
        # Por agora, retornar dados mock estruturados
        # Em implementação completa, faria chamadas para cada planeta
        mock_planets = [
            {
                "id": "199", "name": "Mercury", "name_pt": "Mercúrio",
                "diameter_km": 4879, "mass_kg": 3.3e23, "distance_au": 0.39,
                "moons_count": 0, "orbital_period_days": 88
            },
            {
                "id": "299", "name": "Venus", "name_pt": "Vênus",
                "diameter_km": 12104, "mass_kg": 4.87e24, "distance_au": 0.72,
                "moons_count": 0, "orbital_period_days": 225
            },
            {
                "id": "399", "name": "Earth", "name_pt": "Terra",
                "diameter_km": 12756, "mass_kg": 5.97e24, "distance_au": 1.0,
                "moons_count": 1, "orbital_period_days": 365.25
            },
            {
                "id": "499", "name": "Mars", "name_pt": "Marte",
                "diameter_km": 6792, "mass_kg": 6.42e23, "distance_au": 1.52,
                "moons_count": 2, "orbital_period_days": 687
            },
            {
                "id": "599", "name": "Jupiter", "name_pt": "Júpiter",
                "diameter_km": 142984, "mass_kg": 1.90e27, "distance_au": 5.20,
                "moons_count": 79, "orbital_period_days": 4333
            },
            {
                "id": "699", "name": "Saturn", "name_pt": "Saturno",
                "diameter_km": 120536, "mass_kg": 5.68e26, "distance_au": 9.58,
                "moons_count": 82, "orbital_period_days": 10759
            },
            {
                "id": "799", "name": "Uranus", "name_pt": "Urano",
                "diameter_km": 51118, "mass_kg": 8.68e25, "distance_au": 19.22,
                "moons_count": 27, "orbital_period_days": 30687
            },
            {
                "id": "899", "name": "Neptune", "name_pt": "Netuno",
                "diameter_km": 49528, "mass_kg": 1.02e26, "distance_au": 30.05,
                "moons_count": 14, "orbital_period_days": 60190
            }
        ]
        
        return {"planets": mock_planets}
        
    except Exception as e:
        logger.error(f"Erro ao obter planetas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar dados planetários")

@api_router.get("/planetas/{planet_id}", response_model=Planet,
         summary="Dados Planetários",
         description="Obter dados detalhados de um planeta")
async def get_planet(
    planet_id: str = Path(..., description="ID do planeta"),
    service: HorizonsService = Depends(get_horizons_service)
):
    """Endpoint para planeta específico"""
    try:
        return await service.get_planet_data(planet_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter planeta {planet_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar dados do planeta")

@api_router.get("/planetas/{planet_id}/posicao", response_model=PlanetPosition,
         summary="Posição Planetária",
         description="Obter posição atual de um planeta")
async def get_planet_position(
    planet_id: str = Path(..., description="ID do planeta"),
    date: Optional[str] = Query(None, description="Data (YYYY-MM-DD)"),
    service: HorizonsService = Depends(get_horizons_service)
):
    """Endpoint para posição planetária"""
    try:
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        return await service.get_planet_position(planet_id, date)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na posição do planeta {planet_id}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao calcular posição planetária")

# ==================== ROTAS DE EXOPLANETAS ====================

@api_router.get("/exoplanetas/recentes", response_model=Dict[str, List[Exoplanet]],
         summary="Exoplanetas Recentes",
         description="Descobertas recentes de exoplanetas")
async def get_recent_exoplanets(
    limit: int = Query(25, ge=1, le=100, description="Número máximo de resultados"),
    habitable_only: bool = Query(False, description="Apenas potencialmente habitáveis"),
    service: ExoplanetService = Depends(get_exoplanet_service)
):
    """Endpoint para exoplanetas recentes"""
    try:
        exoplanets = await service.get_recent_discoveries(limit)
        
        if habitable_only:
            exoplanets = [planet for planet in exoplanets if planet.potentially_habitable]
        
        return {"exoplanets": exoplanets}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter exoplanetas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar dados de exoplanetas")

@api_router.get("/exoplanetas/estatisticas", response_model=ExoplanetStatistics,
         summary="Estatísticas de Exoplanetas",
         description="Estatísticas globais de descobertas")
async def get_exoplanet_statistics(
    service: ExoplanetService = Depends(get_exoplanet_service)
):
    """Endpoint para estatísticas de exoplanetas"""
    try:
        return await service.get_statistics()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro nas estatísticas de exoplanetas: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar estatísticas")

# ==================== ROTAS DE NEO ====================

@api_router.get("/neo", response_model=Dict[str, List[Dict[str, Any]]],
         summary="Objetos Próximos à Terra",
         description="Near Earth Objects em aproximação")
async def get_near_earth_objects(
    start_date: str = Query(..., description="Data inicial (YYYY-MM-DD)"),
    end_date: str = Query(..., description="Data final (YYYY-MM-DD)"),
    hazardous_only: bool = Query(False, description="Apenas objetos perigosos"),
    service: NASAService = Depends(get_nasa_service)
):
    """Endpoint para Near Earth Objects"""
    try:
        # Validar intervalo de datas
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        
        if (end - start).days > 7:
            raise HTTPException(
                status_code=400, 
                detail="Intervalo máximo de 7 dias permitido"
            )
        
        neo_objects = await service.get_neo_feed(start_date, end_date)
        
        if hazardous_only:
            neo_objects = [obj for obj in neo_objects if obj.get('potentially_hazardous', False)]
        
        return {"near_earth_objects": neo_objects}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de data inválido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter NEOs: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar objetos próximos")

# ==================== ROTAS DE NOTÍCIAS ====================

@api_router.get("/noticias", response_model=Dict[str, List[Dict[str, Any]]],
         summary="Notícias Espaciais",
         description="Notícias recentes sobre exploração espacial")
async def get_space_news(
    limit: int = Query(10, ge=1, le=50, description="Número de notícias")
):
    """Endpoint para notícias espaciais"""
    try:
        # Mock de notícias por enquanto
        # Em implementação real, integraria com RSS feeds da NASA
        mock_news = [
            {
                "id": "news-1",
                "title": "NASA Atinge Marco de 6.000 Exoplanetas Descobertos",
                "summary": "A humanidade oficialmente catalogou mais de 6.000 planetas orbitando outras estrelas.",
                "date": "2025-07-15",
                "category": "Descoberta",
                "source": "NASA Exoplanet Archive",
                "url": "https://nasa.gov/news/..."
            },
            {
                "id": "news-2",
                "title": "James Webb Detecta Vapor d'Água em K2-18 b",
                "summary": "Telescópio encontra sinais de vapor d'água na atmosfera de exoplaneta potencialmente habitável.",
                "date": "2025-07-10",
                "category": "Astrobiologia",
                "source": "NASA/ESA/STScI",
                "url": "https://nasa.gov/webb/..."
            }
        ]
        
        return {"news": mock_news[:limit]}
        
    except Exception as e:
        logger.error(f"Erro ao obter notícias: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar notícias")

# ==================== ROTAS DE TIMELINE ====================

@api_router.get("/timeline", response_model=Dict[str, List[Dict[str, Any]]],
         summary="Timeline Espacial",
         description="Eventos históricos da exploração espacial")
async def get_space_timeline():
    """Endpoint para timeline da exploração espacial"""
    try:
        # Mock de eventos da timeline
        mock_timeline = [
            {
                "id": "sputnik-1957",
                "year": 1957,
                "title": "Sputnik 1",
                "subtitle": "Início da Era Espacial",
                "description": "Primeiro satélite artificial lançado pela União Soviética.",
                "category": "Marco Histórico",
                "significance": "Início da corrida espacial"
            },
            {
                "id": "gagarin-1961",
                "year": 1961,
                "title": "Yuri Gagarin",
                "subtitle": "Primeiro Humano no Espaço",
                "description": "Primeiro ser humano a viajar para o espaço e orbitar a Terra.",
                "category": "Voo Tripulado",
                "significance": "Prova de que humanos podem sobreviver no espaço"
            },
            {
                "id": "apollo11-1969",
                "year": 1969,
                "title": "Apollo 11",
                "subtitle": "Chegada à Lua",
                "description": "Neil Armstrong e Buzz Aldrin pisam na superfície lunar.",
                "category": "Exploração Lunar",
                "significance": "Maior conquista da exploração espacial tripulada"
            }
        ]
        
        return {"timeline": mock_timeline}
        
    except Exception as e:
        logger.error(f"Erro na timeline: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar timeline")

# ==================== CLEANUP ====================

@api_router.on_event("shutdown")
async def shutdown_services():
    """Fechar conexões dos serviços"""
    await nasa_service.close()
    await horizons_service.close()
    await exoplanet_service.close()
    logger.info("Serviços NASA encerrados")
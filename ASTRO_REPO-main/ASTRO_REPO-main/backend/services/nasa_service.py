import httpx
import asyncio
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
from fastapi import HTTPException

from ..models.astronomical_image import AstronomicalImage, MarsPhoto, MediaType
from ..models.planet import Planet, PlanetPosition
from ..models.exoplanet import Exoplanet, ExoplanetStatistics

logger = logging.getLogger(__name__)

class NASAService:
    """Serviço para integração com APIs da NASA"""
    
    def __init__(self):
        self.api_key = os.getenv('NASA_API_KEY', 'DEMO_KEY')
        self.base_url = "https://api.nasa.gov"
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        """Fechar conexões HTTP"""
        await self.client.aclose()
        
    async def get_apod(self, date: Optional[str] = None, hd: bool = False) -> AstronomicalImage:
        """Obter Astronomy Picture of the Day"""
        params = {
            "api_key": self.api_key,
            "hd": str(hd).lower()
        }
        
        if date:
            params["date"] = date
            
        try:
            response = await self.client.get(f"{self.base_url}/planetary/apod", params=params)
            response.raise_for_status()
            data = response.json()
            
            # Transformar dados NASA para nosso modelo
            return AstronomicalImage(
                title=data.get("title", ""),
                url=data.get("url", ""),
                hd_url=data.get("hdurl"),
                date=datetime.fromisoformat(data.get("date", "")),
                explanation=data.get("explanation", ""),
                media_type=MediaType(data.get("media_type", "image")),
                copyright=data.get("copyright"),
                category="apod"
            )
            
        except httpx.HTTPError as e:
            logger.error(f"Erro na API APOD: {e}")
            raise HTTPException(status_code=503, detail="Serviço APOD temporariamente indisponível")
        except Exception as e:
            logger.error(f"Erro ao processar APOD: {e}")
            raise HTTPException(status_code=502, detail="Erro no processamento dos dados APOD")
    
    async def get_mars_photos(self, sol: int = 1000, camera: str = "FHAZ") -> List[MarsPhoto]:
        """Obter fotos de Marte dos rovers"""
        params = {
            "sol": sol,
            "camera": camera,
            "api_key": self.api_key
        }
        
        try:
            response = await self.client.get(
                f"{self.base_url}/mars-photos/api/v1/rovers/curiosity/photos", 
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            photos = []
            for photo in data.get("photos", [])[:10]:  # Limitar a 10 fotos
                mars_photo = MarsPhoto(
                    id=photo.get("id"),
                    sol=photo.get("sol"),
                    img_src=photo.get("img_src"),
                    earth_date=photo.get("earth_date"),
                    camera=photo.get("camera", {}),
                    rover=photo.get("rover", {}),
                    description_pt=self._generate_mars_photo_description(photo)
                )
                photos.append(mars_photo)
            
            return photos
            
        except httpx.HTTPError as e:
            logger.error(f"Erro na API Mars Photos: {e}")
            raise HTTPException(status_code=503, detail="Serviço de fotos de Marte indisponível")
    
    async def get_neo_feed(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Obter dados de Near Earth Objects"""
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "api_key": self.api_key
        }
        
        try:
            response = await self.client.get(f"{self.base_url}/neo/rest/v1/feed", params=params)
            response.raise_for_status()
            data = response.json()
            
            neo_objects = []
            for date, objects in data.get("near_earth_objects", {}).items():
                for obj in objects:
                    neo_objects.append({
                        "name": obj.get("name", ""),
                        "diameter_min_km": self._get_diameter(obj, "min"),
                        "diameter_max_km": self._get_diameter(obj, "max"),
                        "potentially_hazardous": obj.get("is_potentially_hazardous_asteroid", False),
                        "close_approach_date": date,
                        "miss_distance_km": self._get_close_approach_data(obj, "miss_distance"),
                        "relative_velocity_kmh": self._get_close_approach_data(obj, "relative_velocity"),
                        "description_pt": self._generate_neo_description(obj)
                    })
            
            return neo_objects
            
        except httpx.HTTPError as e:
            logger.error(f"Erro na API NEO: {e}")
            raise HTTPException(status_code=503, detail="Serviço NEO indisponível")
    
    def _get_diameter(self, obj: Dict, size_type: str) -> float:
        """Extrair diâmetro do objeto NEO"""
        try:
            return float(obj.get("estimated_diameter", {})
                        .get("kilometers", {})
                        .get(f"estimated_diameter_{size_type}", 0))
        except (ValueError, TypeError):
            return 0.0
    
    def _get_close_approach_data(self, obj: Dict, data_type: str) -> float:
        """Extrair dados de aproximação"""
        try:
            close_approach = obj.get("close_approach_data", [{}])[0]
            if data_type == "miss_distance":
                return float(close_approach.get("miss_distance", {}).get("kilometers", 0))
            elif data_type == "relative_velocity":
                return float(close_approach.get("relative_velocity", {}).get("kilometers_per_hour", 0))
        except (ValueError, TypeError, IndexError):
            return 0.0
    
    def _generate_mars_photo_description(self, photo: Dict) -> str:
        """Gerar descrição educacional para foto de Marte"""
        camera_name = photo.get("camera", {}).get("full_name", "Câmera desconhecida")
        sol = photo.get("sol", 0)
        rover_name = photo.get("rover", {}).get("name", "Rover")
        
        return f"Imagem capturada pelo rover {rover_name} no sol {sol} (dia marciano) usando a {camera_name}. " \
               f"Esta foto nos ajuda a estudar a geologia e o clima de Marte."
    
    def _generate_neo_description(self, obj: Dict) -> str:
        """Gerar descrição educacional para objeto NEO"""
        name = obj.get("name", "Objeto desconhecido")
        diameter = self._get_diameter(obj, "max")
        hazardous = obj.get("is_potentially_hazardous_asteroid", False)
        
        description = f"O asteroide {name} tem aproximadamente {diameter:.2f} km de diâmetro. "
        
        if hazardous:
            description += "Este objeto é classificado como potencialmente perigoso devido ao seu tamanho e proximidade. "
        else:
            description += "Este objeto não representa perigo para a Terra. "
            
        description += "O estudo destes objetos nos ajuda a entender a formação do Sistema Solar."
        
        return description

class HorizonsService:
    """Serviço para NASA JPL Horizons API"""
    
    def __init__(self):
        self.base_url = "https://ssd.jpl.nasa.gov/api/horizons.api"
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        await self.client.aclose()
        
    async def get_planet_data(self, planet_id: str) -> Planet:
        """Obter dados planetários do Horizons"""
        params = {
            'format': 'json',
            'COMMAND': f"'{planet_id}'",
            'OBJ_DATA': 'YES',
            'MAKE_EPHEM': 'NO'
        }
        
        try:
            response = await self.client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if 'result' not in data:
                raise ValueError("Dados planetários não encontrados")
            
            return self._parse_planet_data(data['result'], planet_id)
            
        except httpx.HTTPError as e:
            logger.error(f"Erro no Horizons para planeta {planet_id}: {e}")
            raise HTTPException(status_code=503, detail="Serviço Horizons indisponível")
    
    async def get_planet_position(self, planet_id: str, date: str) -> PlanetPosition:
        """Obter posição planetária atual"""
        params = {
            'format': 'json',
            'COMMAND': f"'{planet_id}'",
            'OBJ_DATA': 'NO',
            'MAKE_EPHEM': 'YES',
            'EPHEM_TYPE': 'OBSERVER',
            'CENTER': '500@399',  # Geocentric
            'START_TIME': date,
            'STOP_TIME': date,
            'STEP_SIZE': '1d',
            'QUANTITIES': '1,9,20'  # RA, DEC, distance
        }
        
        try:
            response = await self.client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if 'result' not in data:
                raise ValueError("Dados de posição não encontrados")
            
            return self._parse_position_data(data['result'], planet_id, date)
            
        except httpx.HTTPError as e:
            logger.error(f"Erro na posição do planeta {planet_id}: {e}")
            raise HTTPException(status_code=503, detail="Dados de posição indisponíveis")
    
    def _parse_planet_data(self, result_text: str, planet_id: str) -> Planet:
        """Processar dados planetários do Horizons"""
        # Mapeamento de IDs para nomes
        planet_names = {
            '199': 'Mercury', '299': 'Venus', '399': 'Earth', '499': 'Mars',
            '599': 'Jupiter', '699': 'Saturn', '799': 'Uranus', '899': 'Neptune'
        }
        
        name = planet_names.get(planet_id, f"Planet {planet_id}")
        
        # Em implementação real, faria parsing completo do texto do Horizons
        # Por agora, retornando dados básicos
        return Planet(
            id=planet_id,
            name=name,
            type="planet",
            # Dados seriam extraídos do result_text em implementação completa
            data_source="NASA JPL Horizons"
        )
    
    def _parse_position_data(self, result_text: str, planet_id: str, date: str) -> PlanetPosition:
        """Processar dados de posição do Horizons"""
        # Em implementação real, faria parsing do texto de ephemeris
        return PlanetPosition(
            planet_id=planet_id,
            date=datetime.fromisoformat(date),
            # Dados seriam extraídos do result_text
        )

class ExoplanetService:
    """Serviço para NASA Exoplanet Archive"""
    
    def __init__(self):
        self.base_url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        await self.client.aclose()
        
    async def get_recent_discoveries(self, limit: int = 50) -> List[Exoplanet]:
        """Obter descobertas recentes de exoplanetas"""
        query = f"""
        SELECT DISTINCT pl_name, hostname, disc_year, discoverymethod, 
               pl_rade, pl_masse, pl_orbper, sy_dist, pl_eqt
        FROM ps 
        WHERE disc_year >= 2020 AND default_flag = 1
        ORDER BY disc_year DESC, pl_name ASC
        LIMIT {limit}
        """
        
        params = {
            'query': query,
            'format': 'json'
        }
        
        try:
            response = await self.client.get(self.base_url, params=params)
            response.raise_for_status()
            data = response.json()
            
            exoplanets = []
            for row in data:
                exoplanet = Exoplanet(
                    planet_name=row.get('pl_name', ''),
                    host_star=row.get('hostname', ''),
                    discovery_year=int(row.get('disc_year', 0)) if row.get('disc_year') else None,
                    discovery_method=self._map_discovery_method(row.get('discoverymethod', '')),
                    planet_radius=float(row.get('pl_rade', 0)) if row.get('pl_rade') else None,
                    planet_mass=float(row.get('pl_masse', 0)) if row.get('pl_masse') else None,
                    orbital_period=float(row.get('pl_orbper', 0)) if row.get('pl_orbper') else None,
                    distance_ly=float(row.get('sy_dist', 0)) if row.get('sy_dist') else None,
                    equilibrium_temperature=float(row.get('pl_eqt', 0)) if row.get('pl_eqt') else None,
                    potentially_habitable=self._assess_habitability(row),
                    data_source="NASA Exoplanet Archive"
                )
                exoplanets.append(exoplanet)
            
            return exoplanets
            
        except httpx.HTTPError as e:
            logger.error(f"Erro no Exoplanet Archive: {e}")
            raise HTTPException(status_code=503, detail="Arquivo de exoplanetas indisponível")
    
    async def get_statistics(self) -> ExoplanetStatistics:
        """Obter estatísticas de exoplanetas"""
        queries = {
            'total_confirmed': "SELECT COUNT(*) as count FROM ps WHERE default_flag = 1",
            'by_year': """
                SELECT disc_year, COUNT(*) as count 
                FROM ps 
                WHERE disc_year >= 2009 AND default_flag = 1 
                GROUP BY disc_year 
                ORDER BY disc_year
            """,
            'by_method': """
                SELECT discoverymethod, COUNT(*) as count 
                FROM ps 
                WHERE default_flag = 1 
                GROUP BY discoverymethod 
                ORDER BY count DESC
            """
        }
        
        results = {}
        for stat_name, query in queries.items():
            try:
                params = {'query': query, 'format': 'json'}
                response = await self.client.get(self.base_url, params=params)
                response.raise_for_status()
                results[stat_name] = response.json()
            except Exception as e:
                logger.error(f"Erro na consulta {stat_name}: {e}")
                results[stat_name] = []
        
        # Processar resultados em estatísticas
        total_confirmed = results['total_confirmed'][0]['count'] if results['total_confirmed'] else 0
        
        by_method = {}
        for row in results.get('by_method', []):
            method = self._translate_method(row.get('discoverymethod', ''))
            by_method[method] = row.get('count', 0)
        
        by_year = {}
        for row in results.get('by_year', []):
            year = row.get('disc_year')
            if year:
                by_year[int(year)] = row.get('count', 0)
        
        return ExoplanetStatistics(
            total_confirmed=total_confirmed,
            total_candidates=0,  # Seria calculado com query adicional
            by_discovery_method=by_method,
            by_planetary_type={},  # Seria calculado com query adicional
            discoveries_by_year=by_year,
            potentially_habitable_count=0,  # Seria calculado com query adicional
            last_updated=datetime.utcnow()
        )
    
    def _map_discovery_method(self, method: str) -> Optional[str]:
        """Mapear método de descoberta para enum"""
        method_map = {
            'Transit': 'transit',
            'Radial Velocity': 'radial_velocity',
            'Imaging': 'direct_imaging',
            'Microlensing': 'gravitational_microlensing'
        }
        return method_map.get(method)
    
    def _translate_method(self, method: str) -> str:
        """Traduzir método para português"""
        translations = {
            'Transit': 'Trânsito',
            'Radial Velocity': 'Velocidade Radial',
            'Imaging': 'Imageamento Direto',
            'Microlensing': 'Microlente Gravitacional'
        }
        return translations.get(method, method)
    
    def _assess_habitability(self, planet_data: Dict) -> bool:
        """Avaliar habitabilidade potencial"""
        radius = planet_data.get('pl_rade')
        temperature = planet_data.get('pl_eqt')
        
        if radius and temperature:
            try:
                r = float(radius)
                t = float(temperature)
                return 0.5 <= r <= 2.0 and 180 <= t <= 320
            except ValueError:
                return False
        return False
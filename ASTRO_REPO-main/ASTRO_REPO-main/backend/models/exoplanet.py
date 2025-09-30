from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DiscoveryMethod(str, Enum):
    TRANSIT = "transit"
    RADIAL_VELOCITY = "radial_velocity"
    DIRECT_IMAGING = "direct_imaging"
    GRAVITATIONAL_MICROLENSING = "gravitational_microlensing"
    ASTROMETRY = "astrometry"
    PULSAR_TIMING = "pulsar_timing"
    TRANSIT_TIMING_VARIATIONS = "transit_timing_variations"
    OTHER = "other"

class PlanetaryType(str, Enum):
    TERRESTRIAL = "terrestrial"
    SUPER_EARTH = "super_earth"
    MINI_NEPTUNE = "mini_neptune"
    NEPTUNE_LIKE = "neptune_like"
    JUPITER_LIKE = "jupiter_like"
    UNKNOWN = "unknown"

class Exoplanet(BaseModel):
    """Modelo para exoplanetas"""
    id: Optional[str] = Field(None, description="Identificador único")
    planet_name: str = Field(..., description="Nome do exoplaneta")
    host_star: str = Field(..., description="Estrela hospedeira")
    
    # Dados de descoberta
    discovery_year: Optional[int] = Field(None, description="Ano da descoberta")
    discovery_method: Optional[DiscoveryMethod] = Field(None, description="Método de descoberta")
    discovery_facility: Optional[str] = Field(None, description="Instalação de descoberta")
    
    # Características físicas
    planet_radius: Optional[float] = Field(None, description="Raio do planeta (raios terrestres)")
    planet_mass: Optional[float] = Field(None, description="Massa do planeta (massas terrestres)")
    planet_density: Optional[float] = Field(None, description="Densidade (g/cm³)")
    planetary_type: Optional[PlanetaryType] = Field(None, description="Tipo planetário")
    
    # Características orbitais
    orbital_period: Optional[float] = Field(None, description="Período orbital (dias)")
    semi_major_axis: Optional[float] = Field(None, description="Semieixo maior (UA)")
    eccentricity: Optional[float] = Field(None, description="Excentricidade")
    inclination: Optional[float] = Field(None, description="Inclinação (graus)")
    
    # Dados estelares
    stellar_mass: Optional[float] = Field(None, description="Massa estelar (massas solares)")
    stellar_radius: Optional[float] = Field(None, description="Raio estelar (raios solares)")
    stellar_type: Optional[str] = Field(None, description="Tipo estelar")
    stellar_temperature: Optional[float] = Field(None, description="Temperatura estelar (K)")
    
    # Localização
    distance_ly: Optional[float] = Field(None, description="Distância (anos-luz)")
    ra: Optional[float] = Field(None, description="Ascensão reta (graus)")
    dec: Optional[float] = Field(None, description="Declinação (graus)")
    constellation: Optional[str] = Field(None, description="Constelação")
    
    # Habitabilidade
    equilibrium_temperature: Optional[float] = Field(None, description="Temperatura de equilíbrio (K)")
    potentially_habitable: Optional[bool] = Field(None, description="Potencialmente habitável")
    habitable_zone_flag: Optional[str] = Field(None, description="Flag da zona habitável")
    
    # Dados atmosféricos (se disponíveis)
    atmospheric_composition: Optional[Dict[str, float]] = Field(None, description="Composição atmosférica")
    has_atmosphere: Optional[bool] = Field(None, description="Possui atmosfera detectada")
    
    # Informações educacionais
    significance: Optional[str] = Field(None, description="Significância científica")
    interesting_facts: Optional[List[str]] = Field(default_factory=list, description="Fatos interessantes")
    comparison_to_solar_system: Optional[str] = Field(None, description="Comparação com o Sistema Solar")
    
    # Metadados
    last_updated: Optional[datetime] = Field(default_factory=datetime.utcnow)
    data_source: Optional[str] = Field(None, description="Fonte dos dados")
    confirmed: Optional[bool] = Field(True, description="Confirmado")

class ExoplanetStatistics(BaseModel):
    """Estatísticas de exoplanetas"""
    total_confirmed: int = Field(..., description="Total de exoplanetas confirmados")
    total_candidates: int = Field(..., description="Total de candidatos")
    
    # Por método de descoberta
    by_discovery_method: Dict[str, int] = Field(..., description="Por método de descoberta")
    
    # Por tipo planetário
    by_planetary_type: Dict[str, int] = Field(..., description="Por tipo planetário")
    
    # Por ano
    discoveries_by_year: Dict[int, int] = Field(..., description="Descobertas por ano")
    
    # Habitabilidade
    potentially_habitable_count: int = Field(..., description="Potencialmente habitáveis")
    
    # Distância
    closest_exoplanet: Optional[Dict[str, Any]] = Field(None, description="Exoplaneta mais próximo")
    
    # Últimas atualizações
    last_updated: datetime = Field(..., description="Última atualização")

class DetectionMethod(BaseModel):
    """Informações sobre métodos de detecção"""
    method: DiscoveryMethod = Field(..., description="Método")
    name_pt: str = Field(..., description="Nome em português")
    
    description: str = Field(..., description="Descrição")
    description_pt: str = Field(..., description="Descrição em português")
    
    principle: str = Field(..., description="Princípio científico")
    advantages: List[str] = Field(..., description="Vantagens")
    limitations: List[str] = Field(..., description="Limitações")
    
    # Estatísticas
    total_discoveries: int = Field(..., description="Total de descobertas")
    percentage_of_total: float = Field(..., description="Porcentagem do total")
    
    # Missões principais
    key_missions: List[str] = Field(..., description="Missões principais")
    
    # Exemplo histórico
    historical_example: Optional[str] = Field(None, description="Exemplo histórico")
    
    # Futuro
    future_prospects: Optional[str] = Field(None, description="Perspectivas futuras")

class ExoplanetCreate(BaseModel):
    """Modelo para criação de exoplaneta"""
    planet_name: str
    host_star: str
    discovery_year: Optional[int] = None
    discovery_method: Optional[DiscoveryMethod] = None

class ExoplanetUpdate(BaseModel):
    """Modelo para atualização de exoplaneta"""
    potentially_habitable: Optional[bool] = None
    significance: Optional[str] = None
    interesting_facts: Optional[List[str]] = None
    comparison_to_solar_system: Optional[str] = None
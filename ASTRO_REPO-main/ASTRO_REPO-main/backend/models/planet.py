from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class PlanetType(str, Enum):
    TERRESTRIAL = "terrestrial"
    GAS_GIANT = "gas_giant"
    ICE_GIANT = "ice_giant"
    DWARF_PLANET = "dwarf_planet"

class Planet(BaseModel):
    """Modelo para dados planetários"""
    id: str = Field(..., description="Identificador do planeta")
    name: str = Field(..., description="Nome do planeta")
    name_pt: Optional[str] = Field(None, description="Nome em português")
    type: PlanetType = Field(..., description="Tipo do planeta")
    
    # Dados físicos
    diameter_km: Optional[float] = Field(None, description="Diâmetro em quilômetros")
    mass_kg: Optional[float] = Field(None, description="Massa em quilogramas")
    density_g_cm3: Optional[float] = Field(None, description="Densidade em g/cm³")
    surface_gravity_ms2: Optional[float] = Field(None, description="Gravidade superficial em m/s²")
    
    # Dados orbitais
    semi_major_axis_au: Optional[float] = Field(None, description="Semieixo maior em UA")
    orbital_period_days: Optional[float] = Field(None, description="Período orbital em dias")
    eccentricity: Optional[float] = Field(None, description="Excentricidade orbital")
    inclination_degrees: Optional[float] = Field(None, description="Inclinação orbital em graus")
    
    # Dados atmosféricos
    surface_temperature_k: Optional[float] = Field(None, description="Temperatura superficial em Kelvin")
    atmospheric_pressure_pa: Optional[float] = Field(None, description="Pressão atmosférica em Pascal")
    atmosphere_composition: Optional[Dict[str, float]] = Field(None, description="Composição atmosférica")
    
    # Luas e anéis
    moons_count: Optional[int] = Field(None, description="Número de luas")
    has_rings: Optional[bool] = Field(None, description="Possui anéis")
    major_moons: Optional[List[str]] = Field(default_factory=list, description="Luas principais")
    
    # Dados de exploração
    discovery_date: Optional[datetime] = Field(None, description="Data de descoberta")
    missions: Optional[List[str]] = Field(default_factory=list, description="Missões espaciais")
    
    # Dados educacionais
    interesting_facts: Optional[List[str]] = Field(default_factory=list, description="Fatos interessantes")
    structure: Optional[Dict[str, str]] = Field(None, description="Estrutura interna")
    
    # Metadados
    last_updated: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Última atualização")
    data_source: Optional[str] = Field(None, description="Fonte dos dados")

class PlanetPosition(BaseModel):
    """Modelo para posição planetária"""
    planet_id: str = Field(..., description="ID do planeta")
    date: datetime = Field(..., description="Data da observação")
    
    # Coordenadas equatoriais
    right_ascension_deg: Optional[float] = Field(None, description="Ascensão reta em graus")
    declination_deg: Optional[float] = Field(None, description="Declinação em graus")
    
    # Distância e magnitude
    distance_au: Optional[float] = Field(None, description="Distância da Terra em UA")
    apparent_magnitude: Optional[float] = Field(None, description="Magnitude aparente")
    
    # Dados observacionais
    constellation: Optional[str] = Field(None, description="Constelação")
    visibility: Optional[str] = Field(None, description="Visibilidade (dia/noite/crepúsculo)")
    
class PlanetCreate(BaseModel):
    """Modelo para criação de planeta"""
    name: str
    name_pt: Optional[str] = None
    type: PlanetType
    
class PlanetUpdate(BaseModel):
    """Modelo para atualização de planeta"""
    name: Optional[str] = None
    name_pt: Optional[str] = None
    diameter_km: Optional[float] = None
    mass_kg: Optional[float] = None
    interesting_facts: Optional[List[str]] = None
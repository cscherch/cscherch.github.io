from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MissionStatus(str, Enum):
    PLANNED = "planned"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    EXTENDED = "extended"

class MissionType(str, Enum):
    FLYBY = "flyby"
    ORBITER = "orbiter"
    LANDER = "lander"
    ROVER = "rover"
    SAMPLE_RETURN = "sample_return"
    TELESCOPE = "telescope"
    HUMAN = "human"

class SpaceMission(BaseModel):
    """Modelo para missões espaciais"""
    id: str = Field(..., description="Identificador da missão")
    name: str = Field(..., description="Nome da missão")
    name_pt: Optional[str] = Field(None, description="Nome em português")
    
    # Informações básicas
    agency: str = Field(..., description="Agência espacial")
    mission_type: MissionType = Field(..., description="Tipo de missão")
    status: MissionStatus = Field(..., description="Status da missão")
    
    # Datas importantes
    launch_date: Optional[datetime] = Field(None, description="Data de lançamento")
    arrival_date: Optional[datetime] = Field(None, description="Data de chegada")
    end_date: Optional[datetime] = Field(None, description="Data de término")
    
    # Destino e objetivos
    target: str = Field(..., description="Destino da missão")
    primary_objectives: List[str] = Field(..., description="Objetivos primários")
    secondary_objectives: Optional[List[str]] = Field(default_factory=list, description="Objetivos secundários")
    
    # Descrições
    description: str = Field(..., description="Descrição da missão")
    description_pt: Optional[str] = Field(None, description="Descrição em português")
    
    # Informações técnicas
    spacecraft_name: Optional[str] = Field(None, description="Nome da espaçonave")
    launch_vehicle: Optional[str] = Field(None, description="Veículo de lançamento")
    launch_site: Optional[str] = Field(None, description="Local de lançamento")
    
    # Instrumentos e capacidades
    instruments: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="Instrumentos científicos")
    capabilities: Optional[List[str]] = Field(default_factory=list, description="Capacidades")
    
    # Conquistas e descobertas
    major_achievements: Optional[List[str]] = Field(default_factory=list, description="Principais conquistas")
    discoveries: Optional[List[str]] = Field(default_factory=list, description="Descobertas")
    
    # Dados de performance
    planned_duration: Optional[str] = Field(None, description="Duração planejada")
    actual_duration: Optional[str] = Field(None, description="Duração real")
    cost_usd: Optional[float] = Field(None, description="Custo em USD")
    
    # Informações de equipe
    principal_investigator: Optional[str] = Field(None, description="Investigador principal")
    team_size: Optional[int] = Field(None, description="Tamanho da equipe")
    
    # Dados educacionais
    educational_significance: Optional[str] = Field(None, description="Significância educacional")
    fun_facts: Optional[List[str]] = Field(default_factory=list, description="Fatos interessantes")
    
    # Links e recursos
    official_website: Optional[str] = Field(None, description="Site oficial")
    image_url: Optional[str] = Field(None, description="URL da imagem")
    
    # Metadados
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    data_source: Optional[str] = Field(None, description="Fonte dos dados")

class TimelineEvent(BaseModel):
    """Modelo para eventos da timeline espacial"""
    id: str = Field(..., description="Identificador do evento")
    year: int = Field(..., description="Ano do evento")
    date: Optional[datetime] = Field(None, description="Data específica")
    
    title: str = Field(..., description="Título do evento")
    title_pt: Optional[str] = Field(None, description="Título em português")
    
    subtitle: str = Field(..., description="Subtítulo")
    subtitle_pt: Optional[str] = Field(None, description="Subtítulo em português")
    
    description: str = Field(..., description="Descrição")
    description_pt: Optional[str] = Field(None, description="Descrição em português")
    
    # Classificação
    category: str = Field(..., description="Categoria do evento")
    importance_level: int = Field(default=1, ge=1, le=5, description="Nível de importância (1-5)")
    
    # Contexto histórico
    historical_context: Optional[str] = Field(None, description="Contexto histórico")
    significance: Optional[str] = Field(None, description="Significância")
    
    # Participantes
    key_figures: Optional[List[str]] = Field(default_factory=list, description="Figuras importantes")
    organizations: Optional[List[str]] = Field(default_factory=list, description="Organizações envolvidas")
    
    # Mídia
    image_url: Optional[str] = Field(None, description="URL da imagem")
    video_url: Optional[str] = Field(None, description="URL do vídeo")
    
    # Dados educacionais
    educational_impact: Optional[str] = Field(None, description="Impacto educacional")
    related_topics: Optional[List[str]] = Field(default_factory=list, description="Tópicos relacionados")
    
class MissionCreate(BaseModel):
    """Modelo para criação de missão"""
    name: str
    agency: str
    mission_type: MissionType
    status: MissionStatus
    target: str
    description: str
    primary_objectives: List[str]

class MissionUpdate(BaseModel):
    """Modelo para atualização de missão"""
    name: Optional[str] = None
    status: Optional[MissionStatus] = None
    description_pt: Optional[str] = None
    major_achievements: Optional[List[str]] = None
    fun_facts: Optional[List[str]] = None
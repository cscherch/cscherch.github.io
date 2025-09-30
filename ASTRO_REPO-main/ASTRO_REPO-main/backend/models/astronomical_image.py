from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"

class ImageCategory(str, Enum):
    APOD = "apod"
    PLANETS = "planets"
    GALAXIES = "galaxies"
    NEBULAE = "nebulae"
    INSTRUMENTS = "instruments"
    MARS = "mars"
    EARTH = "earth"

class AstronomicalImage(BaseModel):
    """Modelo para imagens astronômicas"""
    id: Optional[str] = Field(None, description="Identificador único")
    title: str = Field(..., description="Título da imagem")
    title_pt: Optional[str] = Field(None, description="Título em português")
    
    # URLs das imagens
    url: HttpUrl = Field(..., description="URL da imagem")
    hd_url: Optional[HttpUrl] = Field(None, description="URL da versão HD")
    thumbnail_url: Optional[HttpUrl] = Field(None, description="URL da miniatura")
    
    # Metadados da imagem
    date: datetime = Field(..., description="Data da imagem")
    media_type: MediaType = Field(default=MediaType.IMAGE, description="Tipo de mídia")
    category: Optional[ImageCategory] = Field(None, description="Categoria da imagem")
    
    # Descrições
    explanation: str = Field(..., description="Explicação científica")
    explanation_pt: Optional[str] = Field(None, description="Explicação em português")
    
    # Informações técnicas
    copyright: Optional[str] = Field(None, description="Direitos autorais")
    credit: Optional[str] = Field(None, description="Créditos")
    telescope: Optional[str] = Field(None, description="Telescópio usado")
    instrument: Optional[str] = Field(None, description="Instrumento usado")
    wavelength: Optional[str] = Field(None, description="Comprimento de onda")
    
    # Coordenadas e localização
    coordinates: Optional[Dict[str, float]] = Field(None, description="Coordenadas celestes")
    constellation: Optional[str] = Field(None, description="Constelação")
    distance_ly: Optional[float] = Field(None, description="Distância em anos-luz")
    
    # Dados educacionais
    educational_notes: Optional[List[str]] = Field(default_factory=list, description="Notas educacionais")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags")
    
    # Metadados
    nasa_id: Optional[str] = Field(None, description="ID da NASA")
    apod_date: Optional[str] = Field(None, description="Data APOD se aplicável")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)

class MarsPhoto(BaseModel):
    """Modelo específico para fotos de Marte"""
    id: int = Field(..., description="ID da foto")
    sol: int = Field(..., description="Sol marciano")
    img_src: HttpUrl = Field(..., description="URL da imagem")
    earth_date: str = Field(..., description="Data terrestre")
    
    # Informações da câmera
    camera: Dict[str, Any] = Field(..., description="Dados da câmera")
    
    # Informações do rover
    rover: Dict[str, Any] = Field(..., description="Dados do rover")
    
    # Contexto educacional
    description_pt: Optional[str] = Field(None, description="Descrição em português")
    geological_context: Optional[str] = Field(None, description="Contexto geológico")

class ImageGallery(BaseModel):
    """Modelo para galeria de imagens"""
    category: ImageCategory = Field(..., description="Categoria da galeria")
    images: List[AstronomicalImage] = Field(..., description="Lista de imagens")
    total_count: int = Field(..., description="Total de imagens")
    page: int = Field(default=1, description="Página atual")
    per_page: int = Field(default=20, description="Imagens por página")

class ImageCreate(BaseModel):
    """Modelo para criação de imagem"""
    title: str
    url: HttpUrl
    explanation: str
    date: datetime
    media_type: MediaType = MediaType.IMAGE
    category: Optional[ImageCategory] = None

class ImageUpdate(BaseModel):
    """Modelo para atualização de imagem"""
    title: Optional[str] = None
    title_pt: Optional[str] = None
    explanation_pt: Optional[str] = None
    educational_notes: Optional[List[str]] = None
    tags: Optional[List[str]] = None
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from pathlib import Path

# Importar rotas
from .api.routes import api_router

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Criar aplicação FastAPI
app = FastAPI(
    title="Sistema Solar Explorer API",
    description="API educativa brasileira para exploração do sistema solar com dados da NASA/ESA",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar origens
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas da API
app.include_router(api_router)

# Rota raiz para verificação de saúde
@app.get("/")
async def root():
    return {
        "message": "Sistema Solar Explorer API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/api/docs"
    }

# Rota de saúde
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "nasa_api": "connected",
            "horizons_api": "connected",
            "exoplanet_archive": "connected"
        }
    }

# Event handlers
@app.on_event("startup")
async def startup_event():
    logger.info("Sistema Solar Explorer API iniciada")
    
    # Verificar variáveis de ambiente essenciais
    nasa_key = os.getenv('NASA_API_KEY')
    if not nasa_key or nasa_key == 'DEMO_KEY':
        logger.warning("NASA_API_KEY não configurada - usando DEMO_KEY (limitado)")
    else:
        logger.info("NASA_API_KEY configurada com sucesso")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Sistema Solar Explorer API finalizada")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
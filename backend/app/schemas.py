from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.models import RoleEnum, DocCategoryEnum

# ==========================================
# AGENCIES (Ce que tu as déjà)
# ==========================================
class AgencyCreate(BaseModel):
    name: str

class AgencyResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    model_config = {"from_attributes": True}

# ==========================================
# USERS
# ==========================================
class UserCreate(BaseModel):
    email: str
    password: str
    role: RoleEnum
    agency_id: Optional[int] = None # Optionnel car un Super-Admin n'a pas d'agence

class UserResponse(BaseModel):
    id: int
    email: str
    role: RoleEnum
    agency_id: Optional[int]
    created_at: datetime
    # Note : On ne renvoie JAMAIS le mot de passe dans la réponse !
    model_config = {"from_attributes": True}

# ==========================================
# DOCUMENT TEMPLATES
# ==========================================
class DocumentTemplateCreate(BaseModel):
    name: str
    category: DocCategoryEnum
    description_for_player: Optional[str] = None
    is_required_by_default: bool = True
    ai_validation_rules: Optional[Dict[str, Any]] = None # Pour stocker du JSON

class DocumentTemplateResponse(BaseModel):
    id: int
    agency_id: Optional[int]
    name: str
    category: DocCategoryEnum
    description_for_player: Optional[str]
    is_required_by_default: bool
    ai_validation_rules: Optional[Dict[str, Any]]
    model_config = {"from_attributes": True}
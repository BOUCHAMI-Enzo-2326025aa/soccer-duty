from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
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

class UserLogin(BaseModel):
    email: str
    password: str


AdminDossierStage = Literal["Trad", "Eval", "Done"]
AdminRecruitmentStatus = Literal[
    "Prospection",
    "Offres en attente",
    "NLI Signée",
    "Paiement en attente",
    "I-20 reçu",
    "Immigration effectuée",
    "Visa reçu",
]
AdminServicePlan = Literal["Formule A", "Formule B"]
AdminAcquisitionChannel = Literal[
    "Instagram",
    "TikTok",
    "Bouche à oreille",
    "Formulaire",
]
AdminIntakePeriod = Literal["Spring", "Fall"]


class AdminPlayerUpdate(BaseModel):
    phone: Optional[str] = None
    dossier_stage: AdminDossierStage
    recruitment_status: AdminRecruitmentStatus
    service_plan: AdminServicePlan
    acquisition_channel: AdminAcquisitionChannel
    intake_period: AdminIntakePeriod


class AdminPlayerResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    date_of_birth: Optional[str]
    university_id: Optional[int]
    university_name: str
    progress_percentage: int
    dossier_stage: AdminDossierStage
    recruitment_status: AdminRecruitmentStatus
    service_plan: AdminServicePlan
    acquisition_channel: AdminAcquisitionChannel
    intake_period: AdminIntakePeriod
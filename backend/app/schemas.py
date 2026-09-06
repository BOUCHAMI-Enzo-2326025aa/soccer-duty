import re

from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
from app.models.models import RoleEnum, DocCategoryEnum, ApplicationScopeEnum

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


class AdminDocumentTemplateSave(BaseModel):
    name: str
    category: DocCategoryEnum
    is_required_by_default: bool = True
    description_for_player: Optional[str] = None  # Tutoriel affiché au joueur
    external_url: Optional[str] = None
    application_scope: ApplicationScopeEnum = ApplicationScopeEnum.GENERIC
    target_university_ids: List[int] = []
    delay_appointment_days: Optional[int] = None
    delay_completion_days: Optional[int] = None
    delay_processing_days: Optional[int] = None

class UserLogin(BaseModel):
    email: str
    password: str


class ChangePasswordPayload(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def _validate_password_policy(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        if not re.search(r"[A-Za-z]", value):
            raise ValueError("Le mot de passe doit contenir au moins une lettre")
        if not re.search(r"[0-9]", value):
            raise ValueError("Le mot de passe doit contenir au moins un chiffre")
        return value


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
    university_id: Optional[int] = None


class AdminCreatePlayerPayload(BaseModel):
    first_name: str
    last_name: str
    email: str
    university_id: Optional[int] = None


class AdminCreatePlayerResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    university_id: Optional[int]
    university_name: str
    temporary_password: str


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
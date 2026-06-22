import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, JSON, Float, Text
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

# ==========================================
# ENUMS (Les listes de choix figés)
# ==========================================
class RoleEnum(enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    AGENCY_ADMIN = "AGENCY_ADMIN"
    PLAYER = "PLAYER"

class AgencyStatusEnum(enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"

class DocCategoryEnum(enum.Enum):
    ACADEMIQUE = "ACADEMIQUE"
    SPORTIF = "SPORTIF"
    IMMIGRATION = "IMMIGRATION"
    FINANCIER = "FINANCIER"
    MEDICAL = "MEDICAL"

class DocStatusEnum(enum.Enum):
    MISSING = "MISSING"
    PENDING = "PENDING"
    VALIDATED = "VALIDATED"
    REJECTED = "REJECTED"

class MilestoneStatusEnum(enum.Enum):
    UPCOMING = "UPCOMING"
    CURRENT = "CURRENT"
    COMPLETED = "COMPLETED"

# ==========================================
# 🏢 CŒUR DU SAAS (Agences & Utilisateurs)
# ==========================================
class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(Enum(AgencyStatusEnum), default=AgencyStatusEnum.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="agency")
    document_templates = relationship("DocumentTemplate", back_populates="agency")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=True) # Null si Super-Admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    agency = relationship("Agency", back_populates="users")
    player_profile = relationship("PlayerProfile", back_populates="user", uselist=False)

# ==========================================
# 👤 PROFILS & ENTITÉS
# ==========================================
class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String)
    division = Column(String) # ex: NCAA D1, NJCAA

class PlayerProfile(Base):
    __tablename__ = "player_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(DateTime)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=True)
    progress_percentage = Column(Integer, default=0)

    user = relationship("User", back_populates="player_profile")
    university = relationship("University")
    documents = relationship("Document", back_populates="player")
    milestones = relationship("Milestone", back_populates="player")

# ==========================================
# 📂 GESTION DOCUMENTAIRE (Templates & Docs)
# ==========================================
class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(Integer, primary_key=True, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=True) # Null = Template global SportPath
    name = Column(String, nullable=False) # ex: "Passeport"
    category = Column(Enum(DocCategoryEnum), nullable=False)
    description_for_player = Column(Text, nullable=True)
    is_required_by_default = Column(Boolean, default=True)
    ai_validation_rules = Column(JSON, nullable=True) # Règles spécifiques pour ton IA

    agency = relationship("Agency", back_populates="document_templates")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("player_profiles.id"), nullable=False)
    document_template_id = Column(Integer, ForeignKey("document_templates.id"), nullable=False)
    status = Column(Enum(DocStatusEnum), default=DocStatusEnum.MISSING)
    s3_url = Column(String, nullable=True)
    ai_analysis_result = Column(JSON, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    player = relationship("PlayerProfile", back_populates="documents")
    template = relationship("DocumentTemplate")

# ==========================================
# 🗺️ PARCOURS & TIMELINE (Génération auto)
# ==========================================
class JourneyTemplate(Base):
    __tablename__ = "journey_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)

    steps = relationship("TemplateStep", back_populates="journey_template")

class TemplateStep(Base):
    __tablename__ = "template_steps"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("journey_templates.id"), nullable=False)
    name = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False)
    document_template_id = Column(Integer, ForeignKey("document_templates.id"), nullable=True) # Lier une étape à un doc précis

    journey_template = relationship("JourneyTemplate", back_populates="steps")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("player_profiles.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(Enum(MilestoneStatusEnum), default=MilestoneStatusEnum.UPCOMING)
    order_index = Column(Integer, nullable=False)

    player = relationship("PlayerProfile", back_populates="milestones")

# ==========================================
# 💬 COMMUNICATION & HISTORIQUE
# ==========================================
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    player_profile_id = Column(Integer, ForeignKey("player_profiles.id"), nullable=False)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

class InternalNote(Base):
    __tablename__ = "internal_notes"

    id = Column(Integer, primary_key=True, index=True)
    player_profile_id = Column(Integer, ForeignKey("player_profiles.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Qui a fait l'action
    action = Column(String, nullable=False) # ex: "DOCUMENT_VALIDATED"
    target_id = Column(Integer, nullable=True) # L'ID de l'objet modifié (ex: ID du document)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
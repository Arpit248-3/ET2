from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.database import Base


class ScenarioState(Base):
    """Tracks which scenario is currently active and demo step."""
    __tablename__ = "scenario_state"

    id = Column(Integer, primary_key=True, index=True, default=1)
    active_scenario_id = Column(String, nullable=True, default=None)
    demo_step = Column(Integer, default=0)
    demo_running = Column(Boolean, default=False)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    """Immutable audit trail for all major actions."""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user = Column(String, nullable=False)
    action = Column(String, nullable=False)
    module = Column(String, nullable=False)
    status = Column(String, nullable=False, default="COMPLETED")
    event_type = Column(String, nullable=False)  # AI, USER, SYSTEM, SECURITY
    details = Column(JSON, nullable=True)


class Decision(Base):
    """Records decisions made by operators."""
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    decision_id = Column(String, unique=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    scenario_id = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    approved_by = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    status = Column(String, default="APPROVED")


class ThresholdConfig(Base):
    """Operator-configurable alert thresholds."""
    __tablename__ = "threshold_config"

    id = Column(Integer, primary_key=True, index=True, default=1)
    config = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String, default="System")


class DBUser(Base):
    """Registered platform operators and administrators."""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
    avatar = Column(String, nullable=True)


class DBReport(Base):
    """Generated analysis and intelligence reports."""
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    format = Column(String, default="PDF")
    generated_by = Column(String, default="UrjaNetra AI")
    size = Column(String, default="2.4 MB")
    status = Column(String, default="READY")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DBDataSource(Base):
    """Connected sensor feeds, external databases, and telemetry links."""
    __tablename__ = "data_sources"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    connection_status = Column(String, default="CONNECTED")
    last_sync_time = Column(String, nullable=True)
    sync_frequency = Column(String, default="REAL-TIME")
    records_count = Column(Integer, default=0)


class DBCollaborationRoom(Base):
    """Active incident response and crisis room channels."""
    __tablename__ = "collaboration_rooms"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)


class DBCollaborationMessage(Base):
    """Chat message feeds inside collaboration rooms."""
    __tablename__ = "collaboration_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(String, nullable=False, index=True)
    sender = Column(String, nullable=False)
    sender_role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)
    avatar = Column(String, nullable=True)


class DBCollaborationApproval(Base):
    """Executive approvals recorded in crisis boards."""
    __tablename__ = "collaboration_approvals"

    id = Column(Integer, primary_key=True, index=True)
    motion_id = Column(String, nullable=False)
    status = Column(String, default="PENDING")
    requested_by = Column(String, nullable=False)
    approved_by = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class DBProfilePreference(Base):
    """Personalized layout and notification parameters."""
    __tablename__ = "profile_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, default="arjun_mehta", index=True)
    theme = Column(String, default="dark")
    notifications_enabled = Column(Boolean, default=True)
    high_contrast = Column(Boolean, default=False)
    refresh_interval_seconds = Column(Integer, default=30)


class PipelineResult(Base):
    """Stores the latest master intelligence pipeline results."""
    __tablename__ = "pipeline_results"

    id = Column(Integer, primary_key=True, index=True, default=1)
    result = Column(JSON, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HelpTicket(Base):
    """Stores user support inquiries and administrator responses."""
    __tablename__ = "help_tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    admin_reply = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="OPEN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())



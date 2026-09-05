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
    """Tamper-evident audit trail with cryptographic hash chaining."""
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
    previous_hash = Column(String, nullable=True)
    current_hash = Column(String, nullable=True)



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
    email = Column(String, nullable=False, unique=True)
    role = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
    avatar = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    department = Column(String, nullable=True)
    clearance_level = Column(String, nullable=True, default="LEVEL-2")
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class DBUserAuth(Base):
    """Hashed credentials for platform users (separate from profile)."""
    __tablename__ = "user_auth"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


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


class AgentRun(Base):
    """Persistent execution record of an LLM agent orchestration mission."""
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, index=True)
    scenario_id = Column(String, nullable=False, index=True)
    mission = Column(Text, nullable=False)
    user_id = Column(String, default="admin_system", index=True)
    status = Column(String, nullable=False, default="RUNNING")  # RUNNING, AWAITING_APPROVAL, APPROVED, REJECTED, COMPLETED, FAILED, SAFE_MODE
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    current_step = Column(String, nullable=True)
    iteration = Column(Integer, default=1)
    max_iterations = Column(Integer, default=3)
    priority_weights = Column(JSON, nullable=True)
    plan_v1 = Column(JSON, nullable=True)
    redteam_critique = Column(JSON, nullable=True)
    replan_reason = Column(Text, nullable=True)
    plan_v2 = Column(JSON, nullable=True)
    policy_evaluation = Column(JSON, nullable=True)
    requires_human_approval = Column(Boolean, default=False)
    approval_status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED, NOT_REQUIRED
    approved_by = Column(String, nullable=True)
    approval_timestamp = Column(DateTime(timezone=True), nullable=True)
    final_decision = Column(JSON, nullable=True)
    safe_mode = Column(Boolean, default=False)
    audit_id = Column(String, nullable=True)
    model_used = Column(String, nullable=True)
    provider = Column(String, nullable=True)


class AgentStep(Base):
    """Fine-grained, persistent step trace within an AgentRun."""
    __tablename__ = "agent_steps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String, nullable=False, index=True)
    sequence = Column(Integer, nullable=False)
    agent_name = Column(String, nullable=False, default="Orchestrator")
    action = Column(String, nullable=False)  # UNDERSTAND, TOOL_CALL, OBSERVATION, SYNTHESIZE_PLAN, RED_TEAM_CRITIQUE, REPLAN, POLICY_CHECK, APPROVAL_REQUEST, EXECUTE_DECISION
    tool_name = Column(String, nullable=True)
    input_json = Column(JSON, nullable=True)
    output_json = Column(JSON, nullable=True)
    status = Column(String, nullable=False, default="SUCCESS")  # SUCCESS, FAILED, FALLBACK, RUNNING
    error = Column(Text, nullable=True)
    latency_ms = Column(Float, default=0.0)
    iteration = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())




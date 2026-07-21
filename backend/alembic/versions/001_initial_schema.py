"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-07-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial database schema."""
    
    # Create User table
    op.create_table(
        'user',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255)),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('is_superuser', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    
    # Create Business table
    op.create_table(
        'business',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('owner_id', sa.Integer, sa.ForeignKey('user.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text),
        sa.Column('logo_url', sa.String(512)),
        sa.Column('system_prompt', sa.Text),
        sa.Column('working_hours', sa.String(255)),
        sa.Column('social_links', sa.JSON),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_business_owner', 'business', ['owner_id'])
    
    # Create Document table
    op.create_table(
        'document',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('business_id', sa.Integer, sa.ForeignKey('business.id'), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_type', sa.String(50)),
        sa.Column('content_text', sa.Text),
        sa.Column('char_count', sa.Integer),
        sa.Column('status', sa.String(50), default='processed'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_document_business', 'document', ['business_id'])
    
    # Create ChatSession table
    op.create_table(
        'chat_session',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('business_id', sa.Integer, sa.ForeignKey('business.id'), nullable=False),
        sa.Column('customer_name', sa.String(255)),
        sa.Column('customer_email', sa.String(255)),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_chat_session_business', 'chat_session', ['business_id'])
    
    # Create Message table
    op.create_table(
        'message',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('chat_session.id'), nullable=False),
        sa.Column('sender', sa.String(50), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('citations', sa.JSON),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('idx_message_session', 'message', ['session_id'])
    
    # Create Ticket table
    op.create_table(
        'ticket',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('business_id', sa.Integer, sa.ForeignKey('business.id'), nullable=False),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('chat_session.id')),
        sa.Column('customer_email', sa.String(255)),
        sa.Column('issue_description', sa.Text),
        sa.Column('status', sa.String(50), default='open'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_ticket_business', 'ticket', ['business_id'])
    op.create_index('idx_ticket_session', 'ticket', ['session_id'])
    
    # Create Analytics table
    op.create_table(
        'analytics',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('business_id', sa.Integer, sa.ForeignKey('business.id'), nullable=False),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('chat_session.id')),
        sa.Column('response_time_seconds', sa.Float),
        sa.Column('customer_satisfaction', sa.Integer),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('idx_analytics_business', 'analytics', ['business_id'])
    op.create_index('idx_analytics_session', 'analytics', ['session_id'])


def downgrade() -> None:
    """Drop all tables."""
    op.drop_index('idx_analytics_session')
    op.drop_index('idx_analytics_business')
    op.drop_table('analytics')
    
    op.drop_index('idx_ticket_session')
    op.drop_index('idx_ticket_business')
    op.drop_table('ticket')
    
    op.drop_index('idx_message_session')
    op.drop_table('message')
    
    op.drop_index('idx_chat_session_business')
    op.drop_table('chat_session')
    
    op.drop_index('idx_document_business')
    op.drop_table('document')
    
    op.drop_index('idx_business_owner')
    op.drop_table('business')
    
    op.drop_table('user')

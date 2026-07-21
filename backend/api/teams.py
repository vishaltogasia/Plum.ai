from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.models import models
from backend.schemas import schemas
from backend.middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/teams", tags=["teams"])

# ==========================================
# Team Endpoints
# ==========================================

@router.post("/{business_id}", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_team(
    business_id: int,
    team_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a team for a business (admin only)."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or unauthorized."
        )
    
    # Check if team already exists
    existing_team = db.query(models.Team).filter(models.Team.business_id == business_id).first()
    if existing_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team already exists for this business."
        )
    
    # Create new team
    team = models.Team(
        business_id=business_id,
        name=team_data.get("name", f"{business.name} Team"),
        description=team_data.get("description")
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    
    return {"id": team.id, "name": team.name, "business_id": team.business_id}

@router.get("/{business_id}", response_model=dict)
def get_team(
    business_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get team details for a business."""
    # Verify business ownership or membership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or unauthorized."
        )
    
    team = db.query(models.Team).filter(models.Team.business_id == business_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found."
        )
    
    members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team.id).all()
    
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "members_count": len(members),
        "created_at": team.created_at
    }

# ==========================================
# Team Member Management Endpoints
# ==========================================

@router.post("/{business_id}/members", status_code=status.HTTP_201_CREATED)
def add_team_member(
    business_id: int,
    member_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to the team (admin only)."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or unauthorized."
        )
    
    # Get or create team
    team = db.query(models.Team).filter(models.Team.business_id == business_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found. Create one first."
        )
    
    # Find user by email
    user = db.query(models.User).filter(models.User.email == member_data.get("email")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email {member_data.get('email')} not found."
        )
    
    # Check if already a member
    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team.id,
        models.TeamMember.user_id == user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team."
        )
    
    # Add team member
    member = models.TeamMember(
        team_id=team.id,
        user_id=user.id,
        role=member_data.get("role", "member")
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {
        "id": member.id,
        "user_id": user.id,
        "email": user.email,
        "role": member.role,
        "joined_at": member.joined_at
    }

@router.get("/{business_id}/members", response_model=List[dict])
def list_team_members(
    business_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all team members for a business."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or unauthorized."
        )
    
    team = db.query(models.Team).filter(models.Team.business_id == business_id).first()
    if not team:
        return []
    
    members = db.query(models.TeamMember).filter(models.TeamMember.team_id == team.id).all()
    
    result = []
    for member in members:
        result.append({
            "id": member.id,
            "user_id": member.user_id,
            "email": member.user.email,
            "full_name": member.user.full_name,
            "role": member.role,
            "joined_at": member.joined_at
        })
    
    return result

@router.put("/{business_id}/members/{member_id}", status_code=status.HTTP_200_OK)
def update_team_member_role(
    business_id: int,
    member_id: int,
    update_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a team member's role (admin only)."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or unauthorized."
        )
    
    team = db.query(models.Team).filter(models.Team.business_id == business_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found."
        )
    
    member = db.query(models.TeamMember).filter(
        models.TeamMember.id == member_id,
        models.TeamMember.team_id == team.id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found."
        )
    
    # Update role
    if "role" in update_data:
        if update_data["role"] not in ["admin", "moderator", "member"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'admin', 'moderator', or 'member'."
            )
        member.role = update_data["role"]
    
    db.commit()
    db.refresh(member)
    
    return {
        "id": member.id,
        "user_id": member.user_id,
        "email": member.user.email,
        "role": member.role
    }

@router.delete("/{business_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    business_id: int,
    member_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from the team (admin only)."""
    # Verify business ownership
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found or unauthorized."
        )
    
    team = db.query(models.Team).filter(models.Team.business_id == business_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found."
        )
    
    member = db.query(models.TeamMember).filter(
        models.TeamMember.id == member_id,
        models.TeamMember.team_id == team.id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found."
        )
    
    # Cannot remove the business owner
    if member.user_id == business.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the business owner from the team."
        )
    
    db.delete(member)
    db.commit()

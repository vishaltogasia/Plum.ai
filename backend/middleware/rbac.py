from functools import wraps
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.models import models
from backend.middleware.auth import get_current_user
from backend.database.session import get_db

# Role hierarchy
ROLE_HIERARCHY = {
    "admin": 3,
    "moderator": 2,
    "member": 1
}

def check_team_access(required_role: str = "member"):
    """
    Decorator to check if user has required role in team.
    
    Usage:
        @router.get("/endpoint")
        @check_team_access("admin")
        def my_endpoint(business_id: int, access: dict = Depends(check_team_access("admin"))):
            pass
    """
    def dependency(
        business_id: int,
        current_user: models.User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Business owner has all permissions
        business = db.query(models.Business).filter(
            models.Business.id == business_id
        ).first()
        
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found."
            )
        
        if business.owner_id == current_user.id:
            return {
                "user_id": current_user.id,
                "business_id": business_id,
                "role": "admin",
                "is_owner": True
            }
        
        # Check team membership
        team = db.query(models.Team).filter(
            models.Team.business_id == business_id
        ).first()
        
        if not team:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this team."
            )
        
        member = db.query(models.TeamMember).filter(
            models.TeamMember.team_id == team.id,
            models.TeamMember.user_id == current_user.id
        ).first()
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this team."
            )
        
        # Check role requirement
        required_level = ROLE_HIERARCHY.get(required_role, 0)
        user_level = ROLE_HIERARCHY.get(member.role, 0)
        
        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires '{required_role}' role or higher."
            )
        
        return {
            "user_id": current_user.id,
            "business_id": business_id,
            "role": member.role,
            "is_owner": False
        }
    
    return dependency

def require_role(*roles: str):
    """
    Function to check if user has one of the required roles.
    
    Usage:
        @router.delete("/endpoint")
        def delete_endpoint(access: dict = Depends(require_role("admin", "owner"))):
            pass
    """
    def dependency(access: dict = Depends(check_team_access())):
        if access["role"] not in roles and not access["is_owner"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of these roles: {', '.join(roles)}"
            )
        return access
    
    return dependency

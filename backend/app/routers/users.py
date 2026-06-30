from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from ..database import get_db
from ..models import User
from ..schemas.user import UserResponse
from ..services.auth_service import get_current_user, require_staff

router = APIRouter(prefix="/api/users", tags=["users"])


class UserAdminUpdate(BaseModel):
    is_staff: Optional[bool] = None
    is_active: Optional[bool] = None


@router.get("/", response_model=list[UserResponse])
def get_users(user: User = Depends(require_staff), db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserAdminUpdate, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own permissions")
        
    if data.is_staff is not None:
        target_user.is_staff = data.is_staff
    if data.is_active is not None:
        target_user.is_active = data.is_active
        
    db.commit()
    db.refresh(target_user)
    return target_user


@router.delete("/{user_id}")
def delete_user(user_id: int, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(target_user)
    db.commit()
    return {"detail": "User deleted successfully"}

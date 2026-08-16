from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.resource import Resource

router = APIRouter(
    prefix="/resources",
    tags=["resources"],
)

@router.get("")
@router.get("/")
def get_all_resources(db: Session = Depends(get_db)):
    """Fetch all resources from the vault."""
    resources = db.query(Resource).filter(Resource.archived == False).all()
    
    # Map to frontend expected format
    return [
        {
            "id": r.id,
            "title": r.title,
            "url": r.url,
            "websiteName": r.website,
            "favicon": r.website_icon,
            "summary": r.summary,
            "category": r.category.name if r.category else "General",
            "purpose": r.purpose.name if r.purpose else "General Reference",
            "tags": [t.name for t in r.tags],
            "mediaType": "article", # Simplified for now
            "dateAdded": r.date_added.isoformat() if r.date_added else None,
            "isFavorite": r.favorite,
            "isArchived": r.archived,
            "difficulty": "Intermediate",
            "length": "5 min read",
            "quality": "High",
            "viewsCount": r.open_count,
            "notes": r.notes
        }
        for r in resources
    ]

@router.post("")
@router.post("/")
def create_resource(data: Dict[str, Any], db: Session = Depends(get_db)):
    """Add a new resource to the vault."""
    # Assuming user_id is hardcoded for now since no auth
    mock_user_id = "default_user"
    
    new_res = Resource(
        user_id=mock_user_id,
        title=data.get("title", "Untitled Resource"),
        url=data.get("url", "#"),
        summary=data.get("summary", ""),
        notes=data.get("notes", ""),
        favorite=data.get("isFavorite", False),
        archived=data.get("isArchived", False)
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    
    return {"id": new_res.id, "title": new_res.title, "url": new_res.url}

@router.put("/{resource_id}")
def update_resource(resource_id: str, data: Dict[str, Any], db: Session = Depends(get_db)):
    """Update an existing resource."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    if "title" in data: res.title = data["title"]
    if "url" in data: res.url = data["url"]
    if "summary" in data: res.summary = data["summary"]
    if "notes" in data: res.notes = data["notes"]
    if "isFavorite" in data: res.favorite = data["isFavorite"]
    if "isArchived" in data: res.archived = data["isArchived"]
    
    db.commit()
    return {"status": "success"}

@router.delete("/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(get_db)):
    """Delete a resource."""
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    db.delete(res)
    db.commit()
    return {"status": "deleted"}

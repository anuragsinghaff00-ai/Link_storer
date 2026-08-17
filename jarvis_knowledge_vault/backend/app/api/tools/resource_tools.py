from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.resource import Resource

def search_resources(db: Session, user_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    query_str = args.get("query", "").lower()
    category = args.get("category", "").lower()
    
    q = db.query(Resource).filter(Resource.user_id == user_id)
    
    # Very basic search implementation for demonstration
    resources = q.all()
    filtered = []
    
    for r in resources:
        match = True
        if query_str:
            if not (query_str in (r.title or "").lower() or query_str in (r.url or "").lower() or query_str in (r.summary or "").lower()):
                match = False
        if match and category:
            if not (r.category and category in r.category.name.lower()):
                match = False
        if match:
            filtered.append(r)
            
    # Limit results
    filtered = filtered[:10]
    
    res_data = [
        {
            "id": r.id,
            "title": r.title,
            "url": r.url,
            "summary": r.summary,
            "category": r.category.name if r.category else "General"
        } for r in filtered
    ]
    
    return {
        "status": "success",
        "message": f"Found {len(res_data)} resources matching your criteria.",
        "resources": res_data
    }

def add_resource(db: Session, user_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    # In a real app we would fetch metadata for the URL here, before confirmation
    url = args.get("url")
    purpose = args.get("purpose", "")
    title = f"Saved Link: {url}"
    
    action_data = {
        "url": url,
        "title": title,
        "purpose": purpose,
        "summary": "Pending save...",
        "websiteName": "Link"
    }
    
    return {
        "status": "requires_confirmation",
        "action": "ADD_RESOURCE",
        "actionData": action_data,
        "message": "I have prepared the resource for saving. Please confirm."
    }

def execute_add_resource(db: Session, user_id: str, action_data: Dict[str, Any]) -> Dict[str, Any]:
    # Actually create the DB record
    new_res = Resource(
        user_id=user_id,
        url=action_data.get("url"),
        title=action_data.get("title", "Saved Link"),
        summary=action_data.get("summary", ""),
        # Simplified purpose / category mapping for mock purposes
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    
    return {
        "status": "success",
        "message": f"Successfully saved resource: {new_res.title}"
    }

def delete_resource(db: Session, user_id: str, args: Dict[str, Any]) -> Dict[str, Any]:
    query_str = args.get("query", "").lower()
    
    # Find matching resources
    resources = db.query(Resource).filter(Resource.user_id == user_id).all()
    matches = [r for r in resources if query_str in (r.title or "").lower() or query_str in (r.url or "").lower()]
    
    if not matches:
        return {
            "status": "success",
            "message": f"I couldn't find any resources matching '{query_str}' to delete."
        }
        
    if len(matches) > 1:
        return {
            "status": "success",
            "message": f"I found {len(matches)} resources matching '{query_str}'. Please be more specific."
        }
        
    target = matches[0]
    
    return {
        "status": "requires_confirmation",
        "action": "DELETE_RESOURCE",
        "actionData": {
            "id": target.id,
            "title": target.title,
            "url": target.url
        },
        "message": f"Are you sure you want to delete '{target.title}'?"
    }

def execute_delete_resource(db: Session, user_id: str, action_data: Dict[str, Any]) -> Dict[str, Any]:
    res_id = action_data.get("id")
    target = db.query(Resource).filter(Resource.id == res_id, Resource.user_id == user_id).first()
    
    if target:
        title = target.title
        db.delete(target)
        db.commit()
        return {
            "status": "success",
            "message": f"Successfully deleted '{title}'."
        }
    else:
        return {
            "status": "error",
            "message": "Resource not found or already deleted."
        }

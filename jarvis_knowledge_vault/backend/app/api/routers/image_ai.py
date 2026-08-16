import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.image import Image
from PIL import Image as PILImage
from google import genai

router = APIRouter(prefix="/images", tags=["Image AI"])

MOCK_USER_ID = "mock_user_123"

# Initialize Gemini Client (Requires GEMINI_API_KEY env variable)
try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Failed to initialize Gemini Client: {e}")

@router.post("/{image_id}/analyze")
def analyze_image(image_id: str, db: Session = Depends(get_db)):
    """
    Triggers AI analysis on an image using Gemini Vision API.
    Extracts OCR text, generates description, and suggests tags/purposes.
    """
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == MOCK_USER_ID).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    if not client:
        # Fallback to mock if API key isn't set
        image.ai_description = "A simulated AI description. (Please set GEMINI_API_KEY to enable real AI vision)."
        image.ocr_text = "SIMULATED OCR TEXT"
    else:
        # Get local file path from storage_path
        filename = os.path.basename(image.storage_path)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        file_path = os.path.join(base_dir, "data", "uploads", "images", filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image file not found on disk")
            
        try:
            # Process with Gemini
            pil_img = PILImage.open(file_path)
            
            prompt = """
            Analyze this image carefully. Provide the output in exactly this format:
            DESCRIPTION: [A detailed description of the image]
            OCR: [Extract all visible text in the image. If none, write 'None']
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[pil_img, prompt]
            )
            
            text = response.text
            
            # Parse response
            desc_part = text.split("OCR:")[0].replace("DESCRIPTION:", "").strip()
            ocr_part = text.split("OCR:")[1].strip() if "OCR:" in text else ""
            
            image.ai_description = desc_part
            image.ocr_text = ocr_part
            
        except Exception as e:
            print(f"Gemini API Error: {e}")
            image.ai_description = f"AI Analysis failed: {str(e)}"
            image.ocr_text = ""
    
    db.commit()
    db.refresh(image)
    
    return {"message": "AI Analysis complete", "data": {"description": image.ai_description, "ocr_text": image.ocr_text}}

@router.get("/{image_id}/similar")
def find_similar_images(image_id: str, db: Session = Depends(get_db)):
    """
    Mock endpoint for finding similar images.
    Requires embedding images with CLIP/Gemini in the future.
    """
    similar = db.query(Image).filter(Image.id != image_id, Image.user_id == MOCK_USER_ID).limit(3).all()
    return similar

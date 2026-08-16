import requests
import io
from PIL import Image

def test_image_vault():
    print("Running Image Vault Test Cases...")
    base_url = "http://localhost:8000/api"
    
    # 1. Check health
    print("Testing /health endpoint...")
    try:
        r = requests.get("http://localhost:8000/health")
        assert r.status_code == 200, f"Health check failed: {r.status_code}"
        print("✅ Health check passed")
    except Exception as e:
        print("❌ Health check failed:", e)
        return
        
    # 2. Upload an image
    print("\nTesting /api/images POST (Upload Image)...")
    
    # Create a dummy image
    img = Image.new('RGB', (100, 100), color = 'red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    files = {'file': ('test_upload.png', img_byte_arr, 'image/png')}
    data = {'title': 'Red Square Test', 'purpose_id': 'Testing'}
    
    try:
        r = requests.post(f"{base_url}/images/", files=files, data=data)
        assert r.status_code == 200, f"Upload failed: {r.status_code} - {r.text}"
        img_data = r.json()
        print("✅ Image uploaded successfully")
        print(f"   ID: {img_data['id']}")
        print(f"   Path: {img_data['storage_path']}")
        
        image_id = img_data['id']
    except Exception as e:
        print("❌ Image upload failed:", e)
        return
        
    # 3. Trigger AI Analysis
    print(f"\nTesting /api/images/{image_id}/analyze POST (Trigger AI)...")
    try:
        r = requests.post(f"{base_url}/images/{image_id}/analyze")
        assert r.status_code == 200, f"Analysis failed: {r.status_code} - {r.text}"
        ai_data = r.json()
        print("✅ AI Analysis triggered successfully")
        print(f"   Description: {ai_data['data']['description']}")
        print(f"   OCR Text: {ai_data['data']['ocr_text']}")
    except Exception as e:
        print("❌ AI Analysis failed:", e)
        return
        
    # 4. Fetch Images list
    print("\nTesting /api/images/ GET (Fetch Grid)...")
    try:
        r = requests.get(f"{base_url}/images/")
        assert r.status_code == 200, f"Fetch failed: {r.status_code}"
        images = r.json()
        print("✅ Images fetched successfully")
        print(f"   Found {len(images)} images in vault")
        assert any(i['id'] == image_id for i in images), "Uploaded image not in grid!"
    except Exception as e:
        print("❌ Image fetch failed:", e)
        return
        
    print("\n🎉 ALL TEST CASES PASSED!")

if __name__ == "__main__":
    test_image_vault()

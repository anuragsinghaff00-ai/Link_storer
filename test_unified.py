import requests

def test_unified_deployment():
    print("Testing Unified Deployment...")
    
    # 1. Check if Root serves index.html
    print("Testing GET / ...")
    r = requests.get("http://localhost:8000/")
    assert r.status_code == 200, f"Root failed: {r.status_code}"
    assert "text/html" in r.headers['Content-Type'], "Root did not return HTML"
    assert "Jarvis AI" in r.text or "LinkStorer" in r.text, "Root did not return correct index.html"
    print("[SUCCESS] Root serves index.html")
    
    # 2. Check if static CSS is available
    print("Testing GET /styles.css ...")
    r = requests.get("http://localhost:8000/styles.css")
    assert r.status_code == 200, f"CSS failed: {r.status_code}"
    assert "text/css" in r.headers.get('Content-Type', ''), "CSS did not return proper content type"
    print("[SUCCESS] Static CSS is served correctly")

    print("\n[SUCCESS] UNIFIED DEPLOYMENT TESTS PASSED!")

if __name__ == "__main__":
    test_unified_deployment()

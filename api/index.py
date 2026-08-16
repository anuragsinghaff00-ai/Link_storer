import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'jarvis_knowledge_vault', 'backend'))
sys.path.append(backend_dir)

try:
    from app.main import app
except Exception as e:
    import traceback
    err = traceback.format_exc()
    # Create a dummy ASGI app to return the error
    async def app(scope, receive, send):
        assert scope['type'] == 'http'
        await send({
            'type': 'http.response.start',
            'status': 500,
            'headers': [
                (b'content-type', b'text/plain'),
            ]
        })
        await send({
            'type': 'http.response.body',
            'body': err.encode('utf-8'),
        })

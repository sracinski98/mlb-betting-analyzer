from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from mlb_analyzer.data.mlb_api import MLBApi

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Initialize API
            mlb_api = MLBApi()
            
            # Get analysis
            analysis = mlb_api.analyze_games()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Convert to JSON and send
            self.wfile.write(json.dumps(analysis).encode())
            
        except Exception as e:
            # Log the error
            print(f"Error: {str(e)}")
            import traceback
            print(traceback.format_exc())
            
            # Send error response
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            self.wfile.write(json.dumps(error_response).encode())

if __name__ == '__main__':
    server = HTTPServer(('localhost', 9090), SimpleHandler)
    print('Starting server on port 9090...')
    server.serve_forever()

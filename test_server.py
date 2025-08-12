from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import os
from io import BytesIO
import json
from mlb_analyzer.data.mlb_api import MLBApi

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from netlify.functions.analyze import handler

class TestServer(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        print(f"\nReceived GET request for path: {self.path}")
        print(f"Headers: {self.headers}")
        
        if self.path.endswith('/analyze'):
            try:
                # Initialize API
                mlb_api = MLBApi()
                
                # Get analysis
                analysis = mlb_api.analyze_games()
                
                # Format the response data
                print("\nSending response headers...")
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET')
                self.end_headers()
                
                print("\nWriting response body...")
                self.wfile.write(json.dumps(analysis).encode())
                print("Response sent successfully")
                except json.JSONDecodeError as e:
                    print(f"Invalid JSON response: {str(e)}")
                    self.send_error(500, f"Invalid JSON response: {str(e)}")
                except Exception as e:
                    print(f"Error decoding response: {str(e)}")
                    self.send_error(500, f"Error decoding response: {str(e)}")
            except Exception as e:
                print(f"Error handling request: {str(e)}")
                import traceback
                print(traceback.format_exc())
                self.send_error(500, f"Error handling request: {str(e)}")
            except Exception as e:
                print(f"Error handling request: {str(e)}")
                import traceback
                print(traceback.format_exc())
        else:
            self.send_response(404)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'Not Found')

def run(server_class=HTTPServer, handler_class=TestServer, port=9000):
    server_class.allow_reuse_address = True
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting server on port {port}...')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Shutting down server...')
        httpd.server_close()

if __name__ == '__main__':
    run()

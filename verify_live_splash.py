import subprocess
import time
import json
import base64
import urllib.request
import urllib.error
import os

ARTIFACT_DIR = r'C:\Users\phucv\.gemini\antigravity\brain\bc866600-a1a7-452b-9ab3-e92305b9bd66'
CHROME_PATH = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
PORT = 9333

def run_test():
    proc = subprocess.Popen([
        CHROME_PATH,
        '--headless=new',
        f'--remote-debugging-port={PORT}',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        'about:blank'
    ])
    
    try:
        # Wait for Chrome to be ready
        time.sleep(1.5)
        
        # Get websocket debugger url
        version_url = f'http://127.0.0.1:{PORT}/json/version'
        with urllib.request.urlopen(version_url) as resp:
            ver_data = json.loads(resp.read().decode('utf-8'))
        
        import websocket
        
        # Helper to take screenshot
        def capture(url, width, height, out_name, delay=0.3):
            # Create new target
            create_url = f'http://127.0.0.1:{PORT}/json/new?about:blank'
            with urllib.request.urlopen(create_url) as resp:
                target = json.loads(resp.read().decode('utf-8'))
            ws_url = target['webSocketDebuggerUrl']
            
            ws = websocket.create_connection(ws_url)
            msg_id = 1
            
            def send(method, params=None):
                nonlocal msg_id
                m = {'id': msg_id, 'method': method, 'params': params or {}}
                msg_id += 1
                ws.send(json.dumps(m))
                while True:
                    r = json.loads(ws.recv())
                    if r.get('id') == m['id']:
                        return r.get('result', {})
            
            send('Page.enable')
            send('Emulation.setDeviceMetricsOverride', {
                'width': width,
                'height': height,
                'deviceScaleFactor': 1,
                'mobile': (width < 600)
            })
            
            send('Page.navigate', {'url': url})
            time.sleep(delay)
            
            shot = send('Page.captureScreenshot', {'format': 'jpeg', 'quality': 90})
            img_bytes = base64.b64decode(shot['data'])
            
            out_path = os.path.join(ARTIFACT_DIR, out_name)
            with open(out_path, 'wb') as f:
                f.write(img_bytes)
            print(f'Captured {out_name} ({width}x{height}) successfully!')
            
            ws.close()
        
        capture('https://p.vql.vn/', 820, 1180, 'live_splash_ipad.jpg', 0.25)
        capture('https://p.vql.vn/', 430, 932, 'live_splash_mobile.jpg', 0.25)
        capture('https://p.vql.vn/', 820, 1180, 'live_after_splash_ipad.jpg', 1.4)
        
    finally:
        proc.terminate()
        proc.wait()

if __name__ == '__main__':
    run_test()

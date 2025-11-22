import requests
import json

# First login to get token
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "username": "admin",  # Change as needed
    "password": "admin123"  # Change as needed
}

print("Step 1: Logging in...")
try:
    login_response = requests.post(login_url, json=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token_data = login_response.json()
        print(f"Login response: {json.dumps(token_data, indent=2)}")
        token = token_data.get('access_token') or token_data.get('data', {}).get('access_token')
        print(f"Got token: {token[:20]}..." if token else "No token received")
        
        # Now test DELETE
        print("\nStep 2: Testing DELETE...")
        delete_url = "http://localhost:8000/api/schedules/class-schedule"
        params = {
            "academic_year_id": 1,
            "session_type": "morning",
            "class_id": 1,
            "section": "1"
        }
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"DELETE URL: {delete_url}")
        print(f"Params: {json.dumps(params, indent=2)}")
        
        response = requests.delete(delete_url, params=params, headers=headers)
        print(f"\nDELETE Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("\n✓ DELETE successful!")
        else:
            print(f"\n✗ DELETE failed with {response.status_code}")
            
    else:
        print(f"Login failed: {login_response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

import requests
import json

# Login first
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "username": "admin",
    "password": "admin123"
}

print("Step 1: Logging in...")
login_response = requests.post(login_url, json=login_data)

if login_response.status_code == 200:
    token_data = login_response.json()
    token = token_data.get('data', {}).get('access_token')
    print(f"✓ Login successful, got token\n")
    
    # Test DELETE endpoint
    print("Step 2: Testing DELETE /api/schedules/class-schedule...")
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
    
    response = requests.delete(delete_url, params=params, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    
    if response.status_code == 200:
        print("\n✅ DELETE SUCCESSFUL!")
        print("\nTeacher availability has been restored.")
        print("The frontend should now work correctly.")
    elif response.status_code == 404:
        print("\n⚠ No schedules found (they may already be deleted)")
    else:
        print(f"\n❌ DELETE FAILED with status {response.status_code}")
        
else:
    print(f"❌ Login failed: {login_response.text}")

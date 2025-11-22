import requests

# Test DELETE endpoint
url = "http://localhost:8000/api/schedules/class-schedule"
params = {
    "academic_year_id": 1,
    "session_type": "morning",
    "class_id": 1,
    "section": "1"
}

# Get auth token first (you may need to adjust this)
# For testing, try without auth or with a simple token
headers = {
    "Content-Type": "application/json"
}

print(f"Testing DELETE: {url}")
print(f"Params: {params}")

try:
    response = requests.delete(url, params=params, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

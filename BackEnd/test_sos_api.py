#!/usr/bin/env python
"""
Test the actual SOS API endpoint
"""
import requests
import json

API_URL = "http://localhost:8000/emergency/alert/"

# Test data matching what the frontend would send
test_data = {
    "user_id": 1,
    "message": "Test SOS Alert - Testing SMS functionality",
    "latitude": 18.5204,
    "longitude": 73.8567,
    "address": "Pune, India"
}

print("=" * 70)
print("TESTING SOS API ENDPOINT")
print("=" * 70)
print(f"\nAPI URL: {API_URL}")
print(f"Test Data: {json.dumps(test_data, indent=2)}")
print("\nSending POST request...")

try:
    response = requests.post(API_URL, json=test_data, timeout=30)
    
    print(f"\n📊 Response Status: {response.status_code}")
    print(f"\n📄 Response Body:")
    print(json.dumps(response.json(), indent=2))
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "=" * 70)
        print("✅ API CALL SUCCESS!")
        print("=" * 70)
        
        if result.get('email_sent'):
            print(f"✉️  Email sent to: {', '.join(result.get('email_recipients', []))}")
        
        if result.get('sms_sent'):
            print(f"📱 SMS sent to: {', '.join(result.get('sms_recipients', []))}")
        else:
            print(f"❌ SMS NOT sent")
            if result.get('sms_error'):
                print(f"   Error: {result.get('sms_error')}")
        
        if result.get('sms_debug'):
            print(f"\n🔍 SMS Debug Info:")
            for key, value in result['sms_debug'].items():
                print(f"   {key}: {value}")
    else:
        print("\n❌ API CALL FAILED!")
        
except requests.exceptions.ConnectionError:
    print("\n❌ ERROR: Cannot connect to Django server!")
    print("Make sure the server is running: python manage.py runserver 0.0.0.0:8000")
except Exception as e:
    print(f"\n❌ ERROR: {e}")

print("\n" + "=" * 70)

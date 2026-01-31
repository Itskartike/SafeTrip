#!/usr/bin/env python
"""
Complete SOS Test - Checks everything and tests the API
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.conf import settings
from twilio.rest import Client

User = get_user_model()

print("=" * 70)
print("COMPLETE SOS FEATURE TEST")
print("=" * 70)

# 1. Check Twilio Configuration
print("\n✅ Step 1: Checking Twilio Configuration")
print(f"   TWILIO_ACCOUNT_SID: {settings.TWILIO_ACCOUNT_SID[:10]}...")
print(f"   TWILIO_AUTH_TOKEN: {'*' * 32}")
print(f"   TWILIO_PHONE_NUMBER: {settings.TWILIO_PHONE_NUMBER}")

# 2. Check User Profile
print("\n✅ Step 2: Checking User Profile")
user = User.objects.get(id=1)
profile = user.profile
print(f"   User: {user.username}")
print(f"   Email: {user.email}")
print(f"   Emergency Phone: {profile.relative_mobile_no}")
print(f"   Emergency Email: {profile.emergency_email}")

# 3. Test Twilio Connection
print("\n✅ Step 3: Testing Twilio Connection")
try:
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    account = client.api.accounts(settings.TWILIO_ACCOUNT_SID).fetch()
    print(f"   Status: {account.status}")
    print(f"   Type: {account.type}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)

# 4. Check Verified Numbers
print("\n✅ Step 4: Checking Verified Numbers")
verified = client.outgoing_caller_ids.list()
print(f"   Verified numbers:")
for caller_id in verified:
    print(f"   • {caller_id.phone_number}")
    if caller_id.phone_number == profile.relative_mobile_no:
        print(f"     ✅ Profile number is VERIFIED!")

# 5. Test SMS Directly
print("\n✅ Step 5: Testing SMS Send")
try:
    message = client.messages.create(
        body=f"🚨 SafeTrip Test\n\nComplete system test successful!\nUser: {user.username}\n\nThis confirms SMS is working! ✅",
        from_=settings.TWILIO_PHONE_NUMBER,
        to=profile.relative_mobile_no
    )
    print(f"   ✅ SMS Sent Successfully!")
    print(f"   Message SID: {message.sid}")
    print(f"   Status: {message.status}")
    print(f"   To: {profile.relative_mobile_no}")
except Exception as e:
    print(f"   ❌ SMS Failed: {e}")
    sys.exit(1)

# 6. Test the send_emergency_alert function directly
print("\n✅ Step 6: Testing send_emergency_alert Function")
from SafeTrip_API.views import send_emergency_alert
from django.test import RequestFactory
import json

factory = RequestFactory()
test_data = {
    "user_id": 1,
    "message": "Direct function test - Testing SMS",
    "latitude": 18.5204,
    "longitude": 73.8567,
    "address": "Pune, India"
}

request = factory.post('/emergency/alert/', 
                       data=json.dumps(test_data),
                       content_type='application/json')

try:
    response = send_emergency_alert(request)
    result = json.loads(response.content)
    
    print(f"   Response Status: {response.status_code}")
    print(f"   Email Sent: {result.get('email_sent')}")
    print(f"   SMS Sent: {result.get('sms_sent')}")
    
    if result.get('sms_sent'):
        print(f"   ✅ SMS Recipients: {result.get('sms_recipients')}")
    else:
        print(f"   ❌ SMS Error: {result.get('sms_error')}")
        if result.get('sms_debug'):
            print(f"   Debug Info:")
            for key, value in result['sms_debug'].items():
                print(f"      {key}: {value}")
    
except Exception as e:
    print(f"   ❌ Function call failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("TEST COMPLETE!")
print("=" * 70)
print("\n💡 If all steps passed, the SOS button should work in the app!")
print("   Just make sure the Django server is running on port 8000.")
print("\n" + "=" * 70)

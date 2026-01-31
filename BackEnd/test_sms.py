#!/usr/bin/env python
"""
Test script to check SMS setup and send a test message
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from twilio.rest import Client
from django.conf import settings

User = get_user_model()

print("=" * 60)
print("TWILIO SMS SETUP TEST")
print("=" * 60)

# Check Twilio settings
print("\n1. Checking Twilio Configuration:")
print(f"   TWILIO_ACCOUNT_SID: {'✓' if settings.TWILIO_ACCOUNT_SID else '✗'} {settings.TWILIO_ACCOUNT_SID}")
print(f"   TWILIO_AUTH_TOKEN: {'✓' if settings.TWILIO_AUTH_TOKEN else '✗'} {'*' * len(settings.TWILIO_AUTH_TOKEN) if settings.TWILIO_AUTH_TOKEN else 'Not set'}")
print(f"   TWILIO_PHONE_NUMBER: {'✓' if settings.TWILIO_PHONE_NUMBER else '✗'} {settings.TWILIO_PHONE_NUMBER}")

# Check users with profiles
print("\n2. Checking User Profiles:")
users = User.objects.all()
print(f"   Total users: {users.count()}")

for user in users:
    try:
        profile = user.profile
        print(f"\n   User: {user.username} (ID: {user.id})")
        print(f"   - Email: {user.email}")
        print(f"   - Contact: {getattr(user, 'contact_no', 'N/A')}")
        print(f"   - Emergency Phone: {profile.relative_mobile_no or 'Not set'}")
        print(f"   - Emergency Email: {profile.emergency_email or 'Not set'}")
        print(f"   - Additional Numbers: {profile.relatives_mobile_numbers}")
        
        # Check phone number format
        if profile.relative_mobile_no:
            if profile.relative_mobile_no.startswith('+'):
                print(f"   - Phone format: ✓ Valid E.164 format")
            else:
                print(f"   - Phone format: ✗ Missing '+' prefix (needs E.164 format)")
                print(f"   - Should be: +{profile.relative_mobile_no}")
    except Exception as e:
        print(f"   No profile for user {user.username}: {e}")

# Test Twilio connection
print("\n3. Testing Twilio Connection:")
try:
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        account = client.api.accounts(settings.TWILIO_ACCOUNT_SID).fetch()
        print(f"   ✓ Connected to Twilio")
        print(f"   Account Status: {account.status}")
        print(f"   Account Type: {account.type}")
    else:
        print("   ✗ Twilio credentials not configured")
except Exception as e:
    print(f"   ✗ Error connecting to Twilio: {e}")

# Offer to send test SMS
print("\n4. Test SMS Options:")
print("   To send a test SMS, you need a phone number in E.164 format (e.g., +1234567890)")
test_number = input("\n   Enter phone number to test (or press Enter to skip): ").strip()

if test_number:
    if not test_number.startswith('+'):
        print(f"   ✗ Invalid format. Must start with '+'. Try: +{test_number}")
    else:
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body="Test message from SafeTrip. SMS is working! 🚀",
                from_=settings.TWILIO_PHONE_NUMBER,
                to=test_number
            )
            print(f"   ✓ Test SMS sent successfully!")
            print(f"   Message SID: {message.sid}")
            print(f"   Status: {message.status}")
        except Exception as e:
            print(f"   ✗ Failed to send SMS: {e}")
else:
    print("   Skipped test SMS")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

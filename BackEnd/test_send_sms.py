#!/usr/bin/env python
"""
Direct SMS sending test to identify the exact issue
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

# Your Twilio credentials
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Target number (formatted to E.164)
TARGET_NUMBER = "+918104121512"

print("=" * 60)
print("DIRECT SMS SEND TEST")
print("=" * 60)
print(f"\nFrom: {TWILIO_PHONE_NUMBER}")
print(f"To: {TARGET_NUMBER}")
print("\nAttempting to send SMS...")

try:
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    message = client.messages.create(
        body="🚨 SafeTrip Test - If you receive this, SMS is working!",
        from_=TWILIO_PHONE_NUMBER,
        to=TARGET_NUMBER
    )
    
    print("\n✅ SUCCESS!")
    print(f"Message SID: {message.sid}")
    print(f"Status: {message.status}")
    print(f"Direction: {message.direction}")
    print(f"Error Code: {message.error_code}")
    print(f"Error Message: {message.error_message}")
    
except Exception as e:
    print("\n❌ FAILED!")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    
    # Check if it's a Twilio specific error
    if hasattr(e, 'code'):
        print(f"Twilio Error Code: {e.code}")
    if hasattr(e, 'msg'):
        print(f"Twilio Error Msg: {e.msg}")
    
    print("\n" + "=" * 60)
    print("COMMON TWILIO ERROR CODES:")
    print("=" * 60)
    print("21211 - Invalid 'To' phone number")
    print("21408 - Permission to send SMS not enabled")
    print("21610 - Unverified number (Trial account)")
    print("21614 - 'To' number not verified (Trial account)")
    print("30006 - Landline or unreachable number")
    print("30007 - Message filtered (spam)")
    
    if "21614" in str(e) or "not verified" in str(e).lower():
        print("\n⚠️  TRIAL ACCOUNT RESTRICTION DETECTED!")
        print("\nSOLUTION:")
        print("1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
        print(f"2. Add and verify: {TARGET_NUMBER}")
        print("3. Or upgrade your Twilio account to paid")

print("\n" + "=" * 60)

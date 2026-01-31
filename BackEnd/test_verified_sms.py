#!/usr/bin/env python
"""
Test SMS to the verified number
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

# Use the VERIFIED number
VERIFIED_NUMBER = "+917045646697"

print("=" * 60)
print("SMS TEST TO VERIFIED NUMBER")
print("=" * 60)
print(f"\nSending SMS to VERIFIED number: {VERIFIED_NUMBER}")

try:
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    message = client.messages.create(
        body="🚨 SafeTrip Emergency Alert Test\n\nThis is a test message. If you receive this, SMS is working perfectly! ✅",
        from_=TWILIO_PHONE_NUMBER,
        to=VERIFIED_NUMBER
    )
    
    print("\n✅ SMS SENT SUCCESSFULLY!")
    print(f"Message SID: {message.sid}")
    print(f"Status: {message.status}")
    print(f"\n🎉 Check your phone {VERIFIED_NUMBER} for the message!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 60)

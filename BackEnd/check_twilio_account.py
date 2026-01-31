#!/usr/bin/env python
"""
Check Twilio verified numbers and account info
"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')

print("=" * 70)
print("TWILIO ACCOUNT INFORMATION")
print("=" * 70)

try:
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    # Get account info
    account = client.api.accounts(TWILIO_ACCOUNT_SID).fetch()
    print(f"\n📱 Account Details:")
    print(f"   Status: {account.status}")
    print(f"   Type: {account.type}")
    
    # Get verified numbers
    print(f"\n✅ Verified Caller IDs:")
    verified = client.outgoing_caller_ids.list()
    
    if verified:
        for caller_id in verified:
            print(f"   • {caller_id.phone_number} ({caller_id.friendly_name})")
    else:
        print("   ❌ No verified numbers found")
        print("\n   You MUST verify the recipient number to send SMS from Trial account!")
    
    # Get phone numbers associated with account
    print(f"\n📞 Your Twilio Phone Numbers:")
    numbers = client.incoming_phone_numbers.list()
    
    if numbers:
        for number in numbers:
            print(f"   • {number.phone_number} ({number.friendly_name})")
    else:
        print("   ❌ No phone numbers found")
    
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 70)
print("TO FIX THE SMS ISSUE:")
print("=" * 70)
print("""
Since you have a TRIAL account, you must verify recipient numbers:

OPTION 1: Verify the Recipient Number (RECOMMENDED FOR TESTING)
--------------------------------------------------------------
1. Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click the red "+" button (Add a new Caller ID)
3. Enter: +918104121512
4. Choose verification method: SMS or Call
5. Enter the verification code you receive
6. Done! Now you can send SMS to this number

OPTION 2: Upgrade to Paid Account (FOR PRODUCTION)
--------------------------------------------------
1. Visit: https://console.twilio.com/billing
2. Add payment method
3. Upgrade account
4. Send SMS to ANY number without verification

OPTION 3: Use a Different Verified Number (FOR TESTING)
-------------------------------------------------------
If you already verified a different number during Twilio signup,
update the user profile to use that number instead.

""")
print("=" * 70)

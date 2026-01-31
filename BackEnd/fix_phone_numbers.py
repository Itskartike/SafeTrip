#!/usr/bin/env python
"""
Script to fix phone numbers to E.164 format
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from SafeTrip_API.models import UserProfile

User = get_user_model()

print("=" * 60)
print("PHONE NUMBER FORMAT FIXER")
print("=" * 60)

def format_indian_number(number):
    """Convert Indian number to E.164 format"""
    # Remove any spaces, dashes, or parentheses
    number = ''.join(filter(str.isdigit, str(number)))
    
    # If it's a 10-digit Indian number, add +91
    if len(number) == 10:
        return f"+91{number}"
    # If it already has 91 prefix
    elif len(number) == 12 and number.startswith('91'):
        return f"+{number}"
    # If it already has + and correct format
    elif number.startswith('+'):
        return number
    else:
        return None

print("\nCurrent phone numbers:")
for user in User.objects.all():
    try:
        profile = user.profile
        print(f"\nUser: {user.username} (ID: {user.id})")
        print(f"  Current emergency phone: {profile.relative_mobile_no}")
        
        if profile.relative_mobile_no:
            fixed_number = format_indian_number(profile.relative_mobile_no)
            if fixed_number and fixed_number != profile.relative_mobile_no:
                print(f"  → Would change to: {fixed_number}")
                
                confirm = input(f"  Update this number? (y/n): ").strip().lower()
                if confirm == 'y':
                    profile.relative_mobile_no = fixed_number
                    profile.save()
                    print(f"  ✓ Updated!")
                else:
                    print(f"  Skipped")
            elif fixed_number == profile.relative_mobile_no:
                print(f"  ✓ Already in correct format")
            else:
                print(f"  ✗ Could not format this number")
    except Exception as e:
        print(f"  Error: {e}")

print("\n" + "=" * 60)
print("\n⚠️  IMPORTANT: Twilio Trial Account Restrictions")
print("=" * 60)
print("""
If you're using a Twilio TRIAL account, you can ONLY send SMS to:
1. Verified phone numbers in your Twilio console
2. The phone number you used to sign up

To verify a phone number:
1. Go to: https://console.twilio.com/
2. Navigate to: Phone Numbers → Manage → Verified Caller IDs
3. Click "Add a new Caller ID"
4. Enter the phone number and verify with the code sent

OR upgrade to a paid account to send to any number.
""")

print("\n" + "=" * 60)

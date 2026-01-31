#!/usr/bin/env python
"""
Update user profile with the verified Twilio number
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from SafeTrip_API.models import UserProfile

User = get_user_model()

print("=" * 70)
print("UPDATE EMERGENCY CONTACT NUMBER")
print("=" * 70)

# Get the user
user = User.objects.get(id=1)
profile = user.profile

print(f"\nUser: {user.username}")
print(f"Current Emergency Contact: {profile.relative_mobile_no}")

verified_number = "+917972864801"
print(f"\nYour VERIFIED Twilio number: {verified_number}")

choice = input(f"\nDo you want to update the emergency contact to the verified number? (y/n): ").strip().lower()

if choice == 'y':
    profile.relative_mobile_no = verified_number
    profile.save()
    print(f"\n✅ Updated! Emergency contact is now: {profile.relative_mobile_no}")
    print("\n🎉 Now try the SOS button - SMS should work!")
else:
    print("\n❌ Not updated.")
    print("\nAlternatively, you can:")
    print(f"1. Verify +918104121512 in Twilio console")
    print(f"2. Or update manually in the app profile")

print("\n" + "=" * 70)

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Update all users without a role to have USER role
users_updated = 0
for user in User.objects.all():
    if not user.role or user.role == '':
        user.role = 'USER'
        user.save()
        users_updated += 1
        print(f"Updated user: {user.username} - Role: {user.role}")

print(f"\nTotal users updated: {users_updated}")

# Show all users with their roles
print("\nAll users and their roles:")
for user in User.objects.all():
    print(f"  {user.username}: {user.role}")

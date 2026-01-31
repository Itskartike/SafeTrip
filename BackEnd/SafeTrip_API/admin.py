from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UserProfile, customUser

@admin.register(customUser)
class CustomUserAdmin(UserAdmin):
    pass


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "blood_group", "relative_mobile_no", "updated_at")
    search_fields = ("user__username", "user__email", "relative_mobile_no")


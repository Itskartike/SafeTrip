from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class customUser(AbstractUser):
    contact_no = models.CharField(max_length=15, null=True, blank=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """
    Additional details user can fill after registration.
    """

    BLOOD_GROUP_CHOICES = [
        ("A+", "A+"),
        ("A-", "A-"),
        ("B+", "B+"),
        ("B-", "B-"),
        ("AB+", "AB+"),
        ("AB-", "AB-"),
        ("O+", "O+"),
        ("O-", "O-"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    image = models.ImageField(upload_to="profile_images/", null=True, blank=True)

    # Primary relative contact number
    relative_mobile_no = models.CharField(max_length=15, blank=True, default="")

    # Additional relative contact numbers
    relatives_mobile_numbers = models.JSONField(default=list, blank=True)

    blood_group = models.CharField(max_length=3, blank=True, default="", choices=BLOOD_GROUP_CHOICES)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile({self.user_id})"


@receiver(post_save, sender=customUser)
def _create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


class OTPStorage(models.Model):
    email = models.EmailField(db_index=True)
    otp = models.CharField(max_length=10)
    counter = models.PositiveIntegerField(default=1)
    is_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({'expired' if self.is_expired else 'active'})"
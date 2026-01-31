from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
# from django.dispatch import receiver
# from django.db.models.signals import post_save
class customUser(AbstractUser):
    contact_no = models.CharField(max_length=15, null=True, blank=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username


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
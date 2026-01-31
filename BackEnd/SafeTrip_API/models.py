from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
# from django.dispatch import receiver
# from django.db.models.signals import post_save
class customUser(AbstractUser):
    contact_no = models.CharField(max_length=15, null=True, blank=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.username
    
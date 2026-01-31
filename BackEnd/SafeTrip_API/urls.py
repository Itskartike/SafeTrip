from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('auth/login/', views.login_user, name='login_user'),
    path('auth/request-otp/', views.request_otp, name='request_otp'),
    path('auth/send-otp/', views.send_otp, name='send_otp'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),
    path('emergency/alert/', views.send_emergency_alert, name='send_emergency_alert'),
    path('profile/me/', views.me_profile, name='me_profile'),
]
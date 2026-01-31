from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register_user'),
    path('auth/login/', views.login_user, name='login_user'),
    path('auth/request-otp/', views.request_otp, name='request_otp'),
    path('auth/send-otp/', views.send_otp, name='send_otp'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),
    path('auth/me/', views.current_user_from_token, name='current_user_from_token'),
    path('emergency/alert/', views.send_emergency_alert, name='send_emergency_alert'),
    path('emergency/alerts/', views.list_emergency_alerts, name='list_emergency_alerts'),
    path('emergency/alerts/<int:alert_id>/status/', views.update_alert_status, name='update_alert_status'),
    path('profile/me/', views.me_profile, name='me_profile'),
]
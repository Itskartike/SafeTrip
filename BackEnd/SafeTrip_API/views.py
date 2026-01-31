
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
import json
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import EmailMessage
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
import secrets
from django.utils import timezone
from django.utils.html import format_html
from datetime import timedelta

from .models import OTPStorage, UserProfile
User = get_user_model()
# Create your views here.


def _json_body(request):
    try:
        return json.loads(request.body or "{}"), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "Invalid JSON body"}, status=400)


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _auth_token_for_user(user_id: int) -> str:
    # Lightweight signed token (not JWT). You can validate later with TimestampSigner.unsign(...).
    signer = TimestampSigner(salt="safetrip-email-otp")
    return signer.sign(str(user_id))


def _get_bearer_token(request):
    auth = (request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION") or "").strip()
    if not auth:
        return ""
    parts = auth.split()
    if len(parts) == 1:
        # Allow passing raw token (not recommended but convenient)
        return parts[0]
    if len(parts) >= 2 and parts[0].lower() in ("bearer", "token"):
        return parts[1]
    return ""


def _auth_user_from_request(request):
    """
    Auth via signed token returned from verify_otp.
    Header: Authorization: Bearer <token>
    """
    token = _get_bearer_token(request)
    if not token:
        return None, JsonResponse({"success": False, "message": "Missing Authorization token"}, status=401)

    signer = TimestampSigner(salt="safetrip-email-otp")
    max_age = int(getattr(settings, "AUTH_TOKEN_MAX_AGE_SECONDS", 60 * 60 * 24 * 30))  # 30 days default

    try:
        user_id_str = signer.unsign(token, max_age=max_age)
    except SignatureExpired:
        return None, JsonResponse({"success": False, "message": "Token expired"}, status=401)
    except BadSignature:
        return None, JsonResponse({"success": False, "message": "Invalid token"}, status=401)

    try:
        user = User.objects.get(id=int(user_id_str))
    except Exception:
        return None, JsonResponse({"success": False, "message": "User not found"}, status=401)
    return user, None


def _clean_phone(value: str) -> str:
    s = (value or "").strip()
    if not s:
        return ""
    # keep + at start, remove spaces/dashes
    s = s.replace(" ", "").replace("-", "")
    if s.startswith("+"):
        rest = "".join([c for c in s[1:] if c.isdigit()])
        return "+" + rest
    return "".join([c for c in s if c.isdigit()])


def _as_phone_list(value):
    if not value:
        return []
    if isinstance(value, list):
        out = []
        for v in value:
            p = _clean_phone(str(v))
            if p:
                out.append(p)
        return out
    if isinstance(value, str):
        # Allow JSON string list, or comma-separated
        raw = value.strip()
        if raw.startswith("[") and raw.endswith("]"):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return _as_phone_list(parsed)
            except Exception:
                pass
        return [p for p in [_clean_phone(v) for v in raw.split(",")] if p]
    return []


def _profile_to_dict(request, profile: UserProfile):
    image_url = ""
    try:
        if profile.image and getattr(profile.image, "url", None):
            image_url = request.build_absolute_uri(profile.image.url)
    except Exception:
        image_url = ""

    return {
        "user": {
            "id": profile.user.id,
            "username": profile.user.username,
            "email": profile.user.email,
            "contact_no": getattr(profile.user, "contact_no", "") or "",
            "first_name": profile.user.first_name or "",
            "last_name": profile.user.last_name or "",
        },
        "profile": {
            "image_url": image_url,
            "relative_mobile_no": profile.relative_mobile_no,
            "relatives_mobile_numbers": profile.relatives_mobile_numbers or [],
            "blood_group": profile.blood_group,
            "height_cm": str(profile.height_cm) if profile.height_cm is not None else None,
            "weight_kg": str(profile.weight_kg) if profile.weight_kg is not None else None,
            "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
        },
    }


def _as_email_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return [str(v).strip().lower() for v in value if str(v).strip()]
    if isinstance(value, str):
        return [v.strip().lower() for v in value.split(",") if v.strip()]
    return []


@csrf_exempt
@require_http_methods(["POST"])
def request_otp(request):
    # Backwards-compatible alias
    return send_otp(request)


@csrf_exempt 
@require_http_methods(["POST"])
def register_user(request):
    try:
        data, err = _json_body(request)
        if err:
            return err
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        contact_no = data.get("contact_no","")
        is_staff = data.get("is_staff","False")
        is_admin = data.get("is_admin","False")


        if not username or not password or not email:
            return JsonResponse({"error": "Username, email, and password are required"}, status=400)
        
        users_qs = User.objects.all()

        if  not contact_no.isdigit():
            return JsonResponse("contact number should be number only",safe=False)
        
        
        if len(contact_no) != 10:
            return JsonResponse("Contact number must be exactly 10 digits.",safe=False)
        
        errors=[]

        if users_qs.filter(username=username).exists():
            errors.append(f" {username} is already taken , use a different username.")
        
        if  users_qs.filter(contact_no = contact_no).exists():
            errors.append( f" {contact_no} Mobile number already registered, use a different one.")
        
        if users_qs.filter(email=email).exists():
            errors.append(f" {email} already registered  , use a different E-mail.")
        if errors:
            return JsonResponse({"errors":errors},status=400)
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            contact_no = contact_no,
            is_staff=is_staff,
            is_admin = is_admin
        )

        return JsonResponse({"message": f"The user '{user.username}' has successfully registered"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def send_otp(request):
    data, err = _json_body(request)
    if err:
        return err

    email_lower = _normalize_email(data.get("email"))
    if not email_lower:
        return JsonResponse({"error": "email is required"}, status=400)

    try:
        user = User.objects.get(email=email_lower)
    except User.DoesNotExist:
        return JsonResponse({"error": "No user found with this email"}, status=404)

    now = timezone.now()

    otp_length = int(getattr(settings, "OTP_LENGTH", 6))
    otp_resend_seconds = int(getattr(settings, "OTP_RESEND_SECONDS", 60))
    block_user_minutes = int(getattr(settings, "BLOCK_USER_MINUTES", 10))
    max_send_attempts = int(getattr(settings, "OTP_MAX_SENDS_PER_WINDOW", 3))

    last_otp = OTPStorage.objects.filter(email=email_lower).order_by("-created_at").first()
    previous_counter = 0

    if last_otp:
        time_diff = now - last_otp.created_at

        # too soon to resend
        if time_diff < timedelta(seconds=otp_resend_seconds):
            return JsonResponse(
                {"success": False, "message": f"Please wait {otp_resend_seconds} seconds before requesting another OTP"},
                status=400,
            )

        # reset counter after block window
        if time_diff <= timedelta(minutes=block_user_minutes):
            previous_counter = int(last_otp.counter or 0)

        # block if too many attempts
        if previous_counter >= max_send_attempts:
            return JsonResponse(
                {"success": False, "message": "Too many attempts. Try again in sometime."},
                status=400,
            )

    # expire all valid old OTPs before sending a new one
    OTPStorage.objects.filter(email=email_lower, is_expired=False).update(is_expired=True)

    # Generate OTP (secure random)
    min_n = 10 ** (otp_length - 1)
    max_n = (10 ** otp_length) - 1
    otp = str(secrets.randbelow(max_n - min_n + 1) + min_n)

    OTPStorage.objects.create(
        email=email_lower,
        otp=otp,
        counter=previous_counter + 1,
        is_expired=False,
    )

    lock_expiry_minutes = int(getattr(settings, "LOCK_EXPIRY_MINUTES", 5))

    subject = "SafeTrip - Your OTP Code"
    body = format_html(
        f"""
    <div style="
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #333;
        text-align: center;
        border: 2px solid #0057ff;
        padding: 25px;
        margin: 20px auto;
        border-radius: 12px;
        max-width: 600px;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.2);
    ">
        <p style="font-size: 20px; font-weight: bold; color: #0057ff;">Secure Verification</p>
        <p style="font-size: 16px;">Dear User,</p>
        <p style="font-size: 16px;">Your One-Time Password (OTP) for verification is:</p>
        <div style="
            background-color: #0057ff;
            color: white;
            font-size: 32px;
            padding: 18px 30px;
            display: inline-block;
            border-radius: 10px;
            margin: 15px 0;
            font-weight: bold;
            letter-spacing: 4px;
            text-align: center;
            box-shadow: 0px 5px 10px rgba(0,0,0,0.3);
        ">{otp}</div>
        <p style="font-size: 16px; font-weight: bold; color: #d32f2f;">This OTP is valid for {lock_expiry_minutes} minutes. Do not share it with anyone.</p>
        <p style="font-size: 14px; color: #555;">If you did not request this, please ignore this email.</p>
        <div style="border-top: 2px solid #0057ff; margin: 20px auto; width: 60%;"></div>
        <p style="font-size: 16px;">Best regards,</p>
        <p style="font-size: 18px; font-weight: bold; color: #0057ff;">Team SafeTrip</p>
    </div>
        """
    )

    from_email = getattr(settings, "EMAIL_HOST_USER", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None)
    if not from_email:
        from_email = "no-reply@safetrip.local"

    email_message = EmailMessage(
        subject=subject,
        body=body,
        from_email=from_email,
        to=[email_lower],
    )
    email_message.content_subtype = "html"
    email_message.send(fail_silently=False)

    return JsonResponse({"success": True, "message": "OTP sent successfully", "email": email_lower, "user_id": user.id})


@csrf_exempt
@require_http_methods(["POST"])
def verify_otp(request):
    data, err = _json_body(request)
    if err:
        return err

    email_lower = _normalize_email(data.get("email"))
    otp = (data.get("otp") or "").strip()

    if not email_lower or not otp:
        return JsonResponse({"success": False, "message": "Email and OTP are required"}, status=400)

    now = timezone.now()
    lock_expiry_minutes = int(getattr(settings, "LOCK_EXPIRY_MINUTES", 5))

    otp_entry = OTPStorage.objects.filter(email=email_lower, otp=otp).order_by("-created_at").first()
    if not otp_entry:
        return JsonResponse({"success": False, "message": "Invalid OTP"}, status=400)

    # expired by time
    if (now - otp_entry.created_at) > timedelta(minutes=lock_expiry_minutes):
        otp_entry.is_expired = True
        otp_entry.save(update_fields=["is_expired"])
        return JsonResponse({"success": False, "message": "OTP expired"}, status=400)

    if otp_entry.is_expired:
        return JsonResponse({"success": False, "message": "OTP already expired"}, status=400)

    otp_entry.is_expired = True
    otp_entry.save(update_fields=["is_expired"])

    try:
        user = User.objects.get(email=email_lower)
    except User.DoesNotExist:
        return JsonResponse({"success": False, "message": "No user found with this email"}, status=404)

    token = _auth_token_for_user(user.id)
    return JsonResponse(
        {
            "success": True,
            "message": "OTP verified successfully",
            "token": token,
            "user": {"id": user.id, "username": user.username, "email": user.email},
        },
        status=200,
    )


@csrf_exempt
@require_http_methods(["POST"])
def send_emergency_alert(request):
    """
    Frontend "Alert" button calls this API.

    Expected JSON:
      {
        "user_id": 2,               # optional (preferred) OR "email"
        "email": "user@mail.com",   # optional if user_id provided
        "message": "I feel unsafe",
        "latitude": 18.5204,        # optional but recommended
        "longitude": 73.8567,       # optional but recommended
        "address": "Pune, India",   # optional
        "extra_recipients": ["friend@mail.com"]  # optional, adds to authority list
      }
    """
    data, err = _json_body(request)
    if err:
        return err

    user_id = data.get("user_id")
    email = _normalize_email(data.get("email"))
    message = (data.get("message") or "").strip()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    address = (data.get("address") or "").strip()
    extra_recipients = _as_email_list(data.get("extra_recipients"))

    if not message:
        return JsonResponse({"success": False, "message": "message is required"}, status=400)

    user = None
    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "message": "User not found"}, status=404)
    elif email:
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({"success": False, "message": "User not found"}, status=404)
    else:
        return JsonResponse({"success": False, "message": "user_id or email is required"}, status=400)

    recipients = []
    recipients.extend(_as_email_list(getattr(settings, "AUTHORITY_ALERT_EMAILS", [])))
    recipients.extend(extra_recipients)
    recipients = sorted(set([r for r in recipients if r]))

    if not recipients:
        return JsonResponse(
            {
                "success": False,
                "message": "No authority recipients configured. Set AUTHORITY_ALERT_EMAILS in .env",
            },
            status=500,
        )

    maps_link = ""
    try:
        if latitude is not None and longitude is not None:
            maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
    except Exception:
        maps_link = ""

    subject = f"SafeTrip EMERGENCY ALERT - {user.username}"
    body = format_html(
        f"""
    <div style="font-family: Arial, sans-serif; color: #222; max-width: 680px; margin: 0 auto;">
      <div style="background:#b71c1c; color:#fff; padding:16px 18px; border-radius:10px;">
        <h2 style="margin:0;">Emergency Alert</h2>
        <p style="margin:6px 0 0;">A SafeTrip user triggered an emergency alert.</p>
      </div>

      <div style="padding:16px 6px;">
        <h3 style="margin:14px 0 8px;">User Details</h3>
        <ul style="margin:0; padding-left:18px;">
          <li><b>Username:</b> {user.username}</li>
          <li><b>Email:</b> {user.email}</li>
          <li><b>Contact:</b> {getattr(user, "contact_no", "") or "-"}</li>
        </ul>

        <h3 style="margin:16px 0 8px;">Alert Message</h3>
        <div style="border:1px solid #ddd; border-radius:10px; padding:12px; background:#fafafa;">
          {message}
        </div>

        <h3 style="margin:16px 0 8px;">Location</h3>
        <ul style="margin:0; padding-left:18px;">
          <li><b>Latitude:</b> {latitude if latitude is not None else "-"}</li>
          <li><b>Longitude:</b> {longitude if longitude is not None else "-"}</li>
          <li><b>Address:</b> {address or "-"}</li>
        </ul>

        {format_html(f'<p style="margin-top:12px;"><a href="{maps_link}" target="_blank" rel="noreferrer" style="display:inline-block;background:#0057ff;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">Open in Google Maps</a></p>') if maps_link else ""}

        <p style="margin-top:18px; font-size:12px; color:#666;">
          This email was generated by SafeTrip. Time: {timezone.now().strftime("%Y-%m-%d %H:%M:%S %Z")}
        </p>
      </div>
    </div>
        """
    )

    from_email = getattr(settings, "EMAIL_HOST_USER", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None) or "no-reply@safetrip.local"
    email_message = EmailMessage(subject=subject, body=body, from_email=from_email, to=recipients)
    email_message.content_subtype = "html"
    email_message.send(fail_silently=False)

    return JsonResponse(
        {
            "success": True,
            "message": "Emergency alert email sent",
            "recipients": recipients,
            "user": {"id": user.id, "username": user.username, "email": user.email},
        }
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def me_profile(request):
    """
    Get / update the logged-in user's profile.

    Auth:
      Authorization: Bearer <token>   (token comes from /auth/verify-otp/)

    Update (POST) supports:
      - JSON body (application/json)
      - multipart/form-data (for image upload)

    Fields:
      image (file)
      relative_mobile_no (string)
      relatives_mobile_numbers (list OR comma string OR JSON-string list)
      blood_group (A+/A-/B+/B-/AB+/AB-/O+/O-)
      height_cm (number)
      weight_kg (number)
    """
    user, err = _auth_user_from_request(request)
    if err:
        return err

    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method == "GET":
        return JsonResponse({"success": True, **_profile_to_dict(request, profile)}, status=200)

    # POST => update
    data = {}
    content_type = (request.content_type or "").lower()
    if "application/json" in content_type:
        data, err2 = _json_body(request)
        if err2:
            return err2
        data = data or {}
        uploaded_image = None
    else:
        # multipart/form-data or x-www-form-urlencoded
        data = request.POST.dict()
        uploaded_image = request.FILES.get("image")
        # If frontend sends multiple values, try to capture list as well
        if "relatives_mobile_numbers" in request.POST and hasattr(request.POST, "getlist"):
            lst = request.POST.getlist("relatives_mobile_numbers")
            if len(lst) > 1:
                data["relatives_mobile_numbers"] = lst

    # update fields if present
    if uploaded_image is not None:
        profile.image = uploaded_image

    if "relative_mobile_no" in data:
        profile.relative_mobile_no = _clean_phone(str(data.get("relative_mobile_no")))

    if "relatives_mobile_numbers" in data:
        profile.relatives_mobile_numbers = _as_phone_list(data.get("relatives_mobile_numbers"))

    if "blood_group" in data:
        profile.blood_group = (data.get("blood_group") or "").strip().upper()

    if "height_cm" in data:
        raw = (data.get("height_cm") or "").strip()
        profile.height_cm = None if raw == "" else raw

    if "weight_kg" in data:
        raw = (data.get("weight_kg") or "").strip()
        profile.weight_kg = None if raw == "" else raw

    try:
        profile.full_clean()
    except Exception as e:
        return JsonResponse({"success": False, "message": "Validation error", "error": str(e)}, status=400)

    profile.save()
    return JsonResponse({"success": True, "message": "Profile updated", **_profile_to_dict(request, profile)}, status=200)
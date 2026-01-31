
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
from twilio.rest import Client

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


def _format_phone_e164(phone: str, default_country_code: str = "91") -> str:
    """
    Format phone number to E.164 format.
    If no + prefix, assumes Indian number and adds +91
    """
    if not phone:
        return ""
    
    # Remove spaces, dashes, parentheses
    phone = ''.join(filter(str.isdigit, str(phone).strip()))
    
    if not phone:
        return ""
    
    # If already has + and digits after, return as is
    if str(phone).startswith('+'):
        return phone
    
    # If 10 digits, assume Indian number
    if len(phone) == 10:
        return f"+{default_country_code}{phone}"
    
    # If 12 digits starting with country code (e.g., 918104121512)
    if len(phone) == 12 and phone.startswith(default_country_code):
        return f"+{phone}"
    
    # If 11-15 digits, assume it has country code
    if 11 <= len(phone) <= 15:
        return f"+{phone}"
    
    # Return with + prefix
    return f"+{phone}" if phone else ""


def _auth_token_for_user(user_id: int) -> str:
    # Lightweight signed token (not JWT). You can validate later with TimestampSigner.unsign(...).
    signer = TimestampSigner(salt="safetrip-email-otp")
    return signer.sign(str(user_id))


def _get_bearer_token(request):
    auth = request.META.get("HTTP_AUTHORIZATION") or ""
    if not auth and getattr(request, "headers", None):
        auth = request.headers.get("Authorization") or ""
    if isinstance(auth, bytes):
        auth = auth.decode("utf-8", errors="replace")
    auth = (auth or "").strip()
    if not auth:
        return ""
    parts = auth.split()
    if len(parts) == 1:
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
            "role": getattr(profile.user, "role", "USER"),
        },
        "profile": {
            "image_url": image_url,
            "relative_mobile_no": profile.relative_mobile_no,
            "emergency_email": profile.emergency_email,
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
def login_user(request):
    data, err = _json_body(request)
    if err:
        return err
        
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)
    
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
         return JsonResponse({"error": "Invalid credentials"}, status=401)
            
    if user.check_password(password):
        token = _auth_token_for_user(user.id)
        return JsonResponse({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "contact_no": getattr(user, "contact_no", ""),
                "role": getattr(user, 'role', 'USER'),
            }
        })
    else:
        return JsonResponse({"error": "Invalid credentials"}, status=401)


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
        role = data.get("role", "USER")  # Default to USER role


        if not username or not password or not email:
            return JsonResponse({"error": "Username, email, and password are required"}, status=400)
        
        # Validate role
        if role not in ['USER', 'AUTHORITY']:
            return JsonResponse({"error": "Invalid role. Must be USER or AUTHORITY"}, status=400)
        
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
            is_admin = is_admin,
            role=role
        )

        return JsonResponse({
            "message": f"The user '{user.username}' has successfully registered",
            "role": user.role
        })

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
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "contact_no": getattr(user, "contact_no", "") or "",
                "role": getattr(user, "role", "USER"),
            },
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
        "phone": "+919876543210",   # optional; SMS is sent to this number (and profile contacts)
        "emergency_contact_phone": "+919876543210",  # optional, same as phone
        "extra_recipients": ["friend@mail.com"]  # optional, adds to authority list
      }
    """
    data, err = _json_body(request)
    if err:
        return err

    user_id = data.get("user_id")
    email = _normalize_email(data.get("email"))
    message = (data.get("message") or "Emergency SOS Alert").strip()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    address = (data.get("address") or "").strip()
    extra_recipients = _as_email_list(data.get("extra_recipients"))
    # Phone number(s) from request - used for SMS when profile has none or as additional recipient
    request_phones = _as_phone_list(data.get("phone") or data.get("emergency_contact_phone"))

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

    # Get user profile for emergency contact and medical info
    try:
        profile = user.profile
    except:
        profile = None

    recipients = []
    recipients.extend(_as_email_list(getattr(settings, "AUTHORITY_ALERT_EMAILS", [])))
    recipients.extend(extra_recipients)
    
    # Add emergency email from profile
    if profile and profile.emergency_email:
        recipients.append(profile.emergency_email)
    
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

    # Prepare medical information
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username
    blood_group = profile.blood_group if profile and profile.blood_group else "-"
    height_cm = profile.height_cm if profile and profile.height_cm else "-"
    weight_kg = profile.weight_kg if profile and profile.weight_kg else "-"
    emergency_contact = profile.relative_mobile_no if profile and profile.relative_mobile_no else "-"

    subject = f"🚨 SafeTrip EMERGENCY ALERT - {full_name}"
    body = format_html(
        f"""
    <div style="font-family: Arial, sans-serif; color: #222; max-width: 680px; margin: 0 auto;">
      <div style="background:#b71c1c; color:#fff; padding:16px 18px; border-radius:10px;">
        <h2 style="margin:0;">🚨 EMERGENCY ALERT</h2>
        <p style="margin:6px 0 0;">A SafeTrip user triggered an emergency SOS alert and needs immediate assistance!</p>
      </div>

      <div style="padding:16px 6px;">
        <h3 style="margin:14px 0 8px; color:#b71c1c;">👤 Person Details</h3>
        <ul style="margin:0; padding-left:18px; line-height:1.8;">
          <li><b>Name:</b> {full_name}</li>
          <li><b>Username:</b> {user.username}</li>
          <li><b>Email:</b> {user.email}</li>
          <li><b>Contact:</b> {getattr(user, "contact_no", "") or "-"}</li>
          <li><b>Emergency Contact:</b> {emergency_contact}</li>
        </ul>

        <h3 style="margin:16px 0 8px; color:#b71c1c;">🩺 Medical Information</h3>
        <ul style="margin:0; padding-left:18px; line-height:1.8;">
          <li><b>Blood Group:</b> <span style="color:#c62828; font-weight:bold;">{blood_group}</span></li>
          <li><b>Height:</b> {height_cm} cm</li>
          <li><b>Weight:</b> {weight_kg} kg</li>
        </ul>

        <h3 style="margin:16px 0 8px; color:#b71c1c;">💬 Alert Message</h3>
        <div style="border:1px solid #ddd; border-radius:10px; padding:12px; background:#fff3e0;">
          {message}
        </div>

        <h3 style="margin:16px 0 8px; color:#b71c1c;">📍 Current Location</h3>
        <ul style="margin:0; padding-left:18px; line-height:1.8;">
          <li><b>Latitude:</b> {latitude if latitude is not None else "-"}</li>
          <li><b>Longitude:</b> {longitude if longitude is not None else "-"}</li>
          <li><b>Address:</b> {address or "-"}</li>
        </ul>

        {format_html(f'<p style="margin-top:12px;"><a href="{maps_link}" target="_blank" rel="noreferrer" style="display:inline-block;background:#b71c1c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;">🗺️ Open Location in Google Maps</a></p>') if maps_link else ""}

        <div style="margin-top:20px; padding:12px; background:#ffebee; border-left:4px solid #b71c1c; border-radius:4px;">
          <p style="margin:0; font-weight:bold; color:#b71c1c;">⚠️ URGENT ACTION REQUIRED</p>
          <p style="margin:4px 0 0; font-size:14px;">This person needs immediate assistance. Please respond as soon as possible.</p>
        </div>

        <p style="margin-top:18px; font-size:12px; color:#666;">
          This email was generated by SafeTrip Emergency Alert System.<br>
          Time: {timezone.now().strftime("%Y-%m-%d %H:%M:%S %Z")}
        </p>
      </div>
    </div>
        """
    )

    from_email = getattr(settings, "EMAIL_HOST_USER", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None) or "no-reply@safetrip.local"
    email_message = EmailMessage(subject=subject, body=body, from_email=from_email, to=recipients)
    email_message.content_subtype = "html"
    email_message.send(fail_silently=False)

    # Send SMS using Twilio
    sms_sent = False
    sms_recipients = []
    sms_error = None
    sms_debug_info = {}
    
    print("\n" + "="*60)
    print("🚨 EMERGENCY ALERT - SMS SENDING STARTED")
    print("="*60)
    
    try:
        twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        twilio_phone = getattr(settings, "TWILIO_PHONE_NUMBER", None)
        
        print(f"📋 Twilio Config Check:")
        print(f"   SID: {'✓' if twilio_sid else '✗'} {twilio_sid[:10] if twilio_sid else 'None'}...")
        print(f"   Token: {'✓' if twilio_token else '✗'} {'*' * 10 if twilio_token else 'None'}")
        print(f"   Phone: {'✓' if twilio_phone else '✗'} {twilio_phone}")
        
        sms_debug_info["twilio_configured"] = bool(twilio_sid and twilio_token and twilio_phone)
        sms_debug_info["twilio_phone"] = twilio_phone
        
        if twilio_sid and twilio_token and twilio_phone:
            client = Client(twilio_sid, twilio_token)
            
            # Prepare SMS message - keep under 160 chars for Twilio Trial (error 30044 = Trial Message Length Exceeded)
            sms_max_len = 160
            short_name = (full_name[:24] + "..") if len(full_name) > 26 else full_name
            if maps_link:
                sms_body = f"SafeTrip EMERGENCY: {short_name} needs help! {maps_link}"
            else:
                loc = (address or (f"{latitude},{longitude}" if latitude is not None and longitude is not None else "?"))[:50]
                sms_body = f"SafeTrip EMERGENCY: {short_name} needs help! Loc: {loc}"
            if len(sms_body) > sms_max_len:
                sms_body = sms_body[: sms_max_len - 3] + "..."
            
            # Collect phone numbers to send SMS
            phone_numbers = []
            skipped_numbers = []
            
            # Add emergency contact from profile (format to E.164)
            if profile and profile.relative_mobile_no:
                formatted = _format_phone_e164(profile.relative_mobile_no)
                if formatted:
                    phone_numbers.append(formatted)
            
            # Add additional relative numbers if any (format to E.164)
            if profile and profile.relatives_mobile_numbers:
                for num in profile.relatives_mobile_numbers:
                    if num and num.strip():
                        formatted = _format_phone_e164(num.strip())
                        if formatted:
                            phone_numbers.append(formatted)
            
            # Add phone number(s) from the request (frontend sends emergency contact so SMS is sent even if profile was empty)
            for req_phone in request_phones:
                formatted = _format_phone_e164(req_phone)
                if formatted and formatted not in phone_numbers:
                    phone_numbers.append(formatted)
            
            sms_debug_info["phone_numbers_found"] = phone_numbers
            sms_debug_info["request_phones"] = request_phones
            sms_debug_info["profile_exists"] = profile is not None
            if profile:
                sms_debug_info["relative_mobile_no"] = profile.relative_mobile_no
                sms_debug_info["relatives_mobile_numbers"] = profile.relatives_mobile_numbers
            
            print(f"\n📞 Phone Numbers Found: {phone_numbers}")
            print(f"👤 Profile exists: {profile is not None}")
            
            # Send SMS to all phone numbers
            sms_errors = []
            message_sids = []  # track SIDs to check delivery status
            for phone in phone_numbers:
                try:
                    # Ensure phone number is in E.164 format
                    if not phone.startswith('+'):
                        skipped_numbers.append(f"{phone} (missing + prefix)")
                        continue
                    
                    message_obj = client.messages.create(
                        body=sms_body,
                        from_=twilio_phone,
                        to=phone
                    )
                    sms_recipients.append(phone)
                    message_sids.append((phone, message_obj.sid))
                    sms_sent = True
                    print(f"✅ SMS accepted by Twilio to {phone}: SID={message_obj.sid} (status={message_obj.status})")
                except Exception as e:
                    error_msg = f"{phone}: {str(e)}"
                    sms_errors.append(error_msg)
                    print(f"❌ Failed to send SMS to {error_msg}")
                    continue
            
            # Check delivery status after a short delay (Twilio updates status asynchronously)
            if message_sids:
                import time
                time.sleep(2)
                for phone, sid in message_sids:
                    try:
                        msg = client.messages(sid).fetch()
                        status = getattr(msg, "status", "unknown")
                        err_code = getattr(msg, "error_code", None)
                        err_msg = getattr(msg, "error_message", None)
                        print(f"   📱 Delivery status for {phone}: {status}" + (f" (error {err_code}: {err_msg})" if err_code else ""))
                        if status in ("failed", "undelivered") and err_code:
                            sms_debug_info[f"twilio_error_{phone}"] = f"{status} - {err_code}: {err_msg}"
                    except Exception as e:
                        print(f"   ⚠ Could not fetch status for {sid}: {e}")
            
            # Hint when SMS not received (common: trial account, India DLT/DNC, unverified number)
            if sms_sent and any(p.startswith("+91") for p in sms_recipients):
                print("\n📌 If SMS was not received (India +91):")
                print("   1. Trial: Add +91 as Verified Caller ID: https://console.twilio.com/us1/develop/phone-numbers/manage/verified")
                print("   2. Check status: https://console.twilio.com/us1/monitor/logs/sms (30044=message too long, 30004=blocked)")
            
            sms_debug_info["skipped_numbers"] = skipped_numbers
            sms_debug_info["sms_errors"] = sms_errors
            
            if not phone_numbers:
                sms_error = "No phone numbers found in user profile"
            elif skipped_numbers and not sms_sent:
                sms_error = f"All phone numbers skipped (must start with +): {skipped_numbers}"
            elif sms_errors and not sms_sent:
                sms_error = f"Failed to send to all numbers: {'; '.join(sms_errors)}"
        else:
            missing = []
            if not twilio_sid:
                missing.append("TWILIO_ACCOUNT_SID")
            if not twilio_token:
                missing.append("TWILIO_AUTH_TOKEN")
            if not twilio_phone:
                missing.append("TWILIO_PHONE_NUMBER")
            sms_error = f"Twilio credentials not configured. Missing: {', '.join(missing)}"
    except Exception as e:
        sms_error = f"SMS sending failed: {str(e)}"
        print(f"🚨 Twilio SMS Error: {str(e)}")
        import traceback
        print("🔍 Full traceback:")
        traceback.print_exc()
        sms_debug_info["exception_trace"] = traceback.format_exc()
    
    # Ensure all SMS variables are initialized
    if 'sms_debug_info' not in locals():
        sms_debug_info = {"error": "SMS variables not initialized"}
    
    print(f"\n📊 SMS FINAL RESULT:")
    print(f"   SMS Sent: {sms_sent}")
    print(f"   SMS Recipients: {sms_recipients}")
    print(f"   SMS Error: {sms_error}")
    print("=" * 60 + "\n")

    # Save alert to database
    from .models import EmergencyAlert
    alert = EmergencyAlert.objects.create(
        user=user,
        name=full_name,
        email=user.email,
        phone=getattr(user, "contact_no", "") or "",
        blood_group=blood_group if blood_group != "-" else "",
        height_cm=str(height_cm) if height_cm != "-" else "",
        weight_kg=str(weight_kg) if weight_kg != "-" else "",
        latitude=latitude,
        longitude=longitude,
        address=address,
        message=message,
        emergency_contact_phone=emergency_contact if emergency_contact != "-" else "",
        emergency_email=profile.emergency_email if profile and profile.emergency_email else "",
        status="PENDING"
    )

    return JsonResponse(
        {
            "success": True,
            "message": "Emergency alert sent successfully",
            "email_sent": True,
            "email_recipients": recipients,
            "sms_sent": sms_sent,
            "sms_recipients": sms_recipients,
            "sms_error": sms_error,
            "sms_debug": sms_debug_info,
            "alert_id": alert.id,
            "user": {"id": user.id, "username": user.username, "email": user.email},
        }
    )


@csrf_exempt
@require_http_methods(["GET"])
def current_user_from_token(request):
    """
    Return the current user and profile from the Authorization token only.
    No fallback - use this for "who am I" so refresh shows the correct panel (USER vs AUTHORITY).
    """
    user, err = _auth_user_from_request(request)
    if err:
        return err
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return JsonResponse({"success": True, **_profile_to_dict(request, profile)}, status=200)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def me_profile(request):
    """
    Get / update the current user's profile.
    When Authorization token is present, use the token to identify the user (correct role/panel).
    Without token (e.g. testing), fall back to user_id from query/body or first user.
    """
    user = None
    if _get_bearer_token(request):
        user, err = _auth_user_from_request(request)
        if err:
            return err
    if not user:
        user_id = None
        if request.method == "GET":
            user_id = request.GET.get("user_id")
        else:
            try:
                body_data = json.loads(request.body or "{}")
                user_id = body_data.get("user_id")
            except Exception:
                user_id = request.POST.get("user_id") if request.POST else None
        if not user_id:
            user = User.objects.first()
            if not user:
                return JsonResponse({"success": False, "message": "No user_id provided"}, status=400)
        else:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({"success": False, "message": "User not found"}, status=404)

    # --- GET/CREATE PROFILE ---
    profile, _ = UserProfile.objects.get_or_create(user=user)

    if request.method == "GET":
        return JsonResponse({"success": True, **_profile_to_dict(request, profile)}, status=200)

    # --- 4. PREPARE DATA ---
    data = {}
    content_type = (request.content_type or "").lower()
    uploaded_image = None
    
    if "application/json" in content_type:
        try:
            data = json.loads(request.body)
        except:
            data = {}
    else:
        # Form Data
        data = request.POST.dict()
        uploaded_image = request.FILES.get("image")
        
        # Handle list of numbers
        if "relatives_mobile_numbers" in request.POST and hasattr(request.POST, "getlist"):
            lst = request.POST.getlist("relatives_mobile_numbers")
            if len(lst) > 1:
                data["relatives_mobile_numbers"] = lst

    # --- 5. UPDATE FIELDS ---
    if uploaded_image is not None:
        profile.image = uploaded_image

    if "relative_mobile_no" in data:
        # Convert to string to avoid errors
        profile.relative_mobile_no = str(data.get("relative_mobile_no")).strip()

    if "emergency_email" in data:
        profile.emergency_email = str(data.get("emergency_email") or "").strip()

    if "relatives_mobile_numbers" in data:
        raw_list = data.get("relatives_mobile_numbers")
        if isinstance(raw_list, list):
            profile.relatives_mobile_numbers = raw_list
        else:
            profile.relatives_mobile_numbers = [str(raw_list)]

    if "blood_group" in data:
        profile.blood_group = str(data.get("blood_group") or "").strip().upper()

    # --- THE FIX: Convert numbers to string before stripping ---
    if "height_cm" in data:
        val = data.get("height_cm")
        raw = str(val).strip() if val is not None else ""
        profile.height_cm = None if raw == "" else raw

    if "weight_kg" in data:
        val = data.get("weight_kg")
        raw = str(val).strip() if val is not None else ""
        profile.weight_kg = None if raw == "" else raw

    # --- 6. SAVE ---
    try:
        profile.full_clean()
    except Exception as e:
        return JsonResponse({"success": False, "message": "Validation error", "error": str(e)}, status=400)

    profile.save()
    return JsonResponse({"success": True, "message": "Profile updated", **_profile_to_dict(request, profile)}, status=200)


@csrf_exempt
@require_http_methods(["GET"])
def list_emergency_alerts(request):
    """
    List all emergency alerts with optional filtering by status
    """
    from .models import EmergencyAlert
    
    status_filter = request.GET.get("status", None)
    
    alerts = EmergencyAlert.objects.all()
    if status_filter:
        alerts = alerts.filter(status=status_filter)
    
    alerts_data = []
    for alert in alerts:
        alerts_data.append({
            "id": alert.id,
            "name": alert.name,
            "email": alert.email,
            "phone": alert.phone,
            "blood_group": alert.blood_group,
            "height_cm": alert.height_cm,
            "weight_kg": alert.weight_kg,
            "latitude": str(alert.latitude) if alert.latitude else None,
            "longitude": str(alert.longitude) if alert.longitude else None,
            "address": alert.address,
            "message": alert.message,
            "status": alert.status,
            "emergency_contact_phone": alert.emergency_contact_phone,
            "emergency_email": alert.emergency_email,
            "timestamp": alert.created_at.isoformat(),
            "updated_at": alert.updated_at.isoformat(),
        })
    
    return JsonResponse({
        "success": True,
        "alerts": alerts_data,
        "count": len(alerts_data)
    })


@csrf_exempt
@require_http_methods(["POST", "PATCH"])
def update_alert_status(request, alert_id):
    """
    Update the status of an emergency alert
    """
    from .models import EmergencyAlert
    
    try:
        alert = EmergencyAlert.objects.get(id=alert_id)
    except EmergencyAlert.DoesNotExist:
        return JsonResponse({"success": False, "message": "Alert not found"}, status=404)
    
    data, err = _json_body(request)
    if err:
        return err
    
    new_status = data.get("status")
    if new_status not in ["PENDING", "IN_PROGRESS", "RESOLVED"]:
        return JsonResponse({"success": False, "message": "Invalid status"}, status=400)
    
    alert.status = new_status
    alert.save()
    
    return JsonResponse({
        "success": True,
        "message": "Alert status updated",
        "alert": {
            "id": alert.id,
            "status": alert.status,
            "updated_at": alert.updated_at.isoformat()
        }
    })
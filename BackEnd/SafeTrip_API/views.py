
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
import json
from django.contrib.auth import get_user_model
User = get_user_model()
# Create your views here.
@csrf_exempt 
@require_http_methods(["POST"])
def register_user(request):
    try:
        data = json.loads(request.body)
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
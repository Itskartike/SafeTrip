import requests
import json
import secrets

BASE_URL = "http://127.0.0.1:8000"

def test_login():
    # 1. Register a new user
    username = f"testuser_{secrets.randbelow(10000)}"
    password = "testpassword123"
    email = f"{username}@example.com"
    contact_no = str(1000000000 + secrets.randbelow(999999999))
    
    print(f"Registering user: {username}")
    reg_data = {
        "username": username,
        "email": email,
        "password": password,
        "contact_no": contact_no
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/register/", json=reg_data)
        print("Register response:", resp.text)
        if resp.status_code != 200:
            print("Registration failed, skipping login test.")
            return
    except Exception as e:
        print(f"Failed to connect to server: {e}")
        return

    # 2. Login with correct credentials
    print("\nTesting correct login...")
    login_data = {
        "username": username,
        "password": password
    }
    resp = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    print("Login response:", resp.text)
    
    if resp.status_code == 200:
        print("Login SUCCESS!")
    else:
        print("Login FAILED!")

    # 3. Login with incorrect password
    print("\nTesting incorrect password...")
    bad_login_data = {
        "username": username,
        "password": "wrongpassword"
    }
    resp = requests.post(f"{BASE_URL}/auth/login/", json=bad_login_data)
    print("Bad Login response:", resp.text)
    
    if resp.status_code == 401:
        print("Bad Login Check SUCCESS (Expected 401)")
    else:
        print("Bad Login Check FAILED (Expected 401)")

if __name__ == "__main__":
    test_login()

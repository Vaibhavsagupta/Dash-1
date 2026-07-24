
from app.auth import get_password_hash

print(f"Hash for 'admin': {get_password_hash('admin')}")
print(f"Hash for 'Vaibhav': {get_password_hash('Vaibhav')}")

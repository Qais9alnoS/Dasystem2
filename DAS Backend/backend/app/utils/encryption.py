"""
Data Encryption Utilities
Provides encryption and decryption functions for sensitive data
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from typing import Union

from ..config import settings

# Generate a key from the secret key in settings
def _get_encryption_key() -> bytes:
    """Generate encryption key from settings secret key"""
    # Use PBKDF2 to derive a key from the secret key
    salt = b'school_management_salt_16'  # Fixed salt for consistent encryption
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return key

# Create a Fernet instance for encryption/decryption
def _get_fernet() -> Fernet:
    """Get Fernet instance for encryption/decryption"""
    key = _get_encryption_key()
    return Fernet(key)

def encrypt_sensitive_data(data: Union[str, int]) -> str:
    """
    Encrypt sensitive data like phone numbers, addresses, etc.
    
    Args:
        data: The data to encrypt (string or integer)
        
    Returns:
        str: Base64 encoded encrypted data
    """
    if data is None:
        return None
    
    fernet = _get_fernet()
    data_bytes = str(data).encode('utf-8')
    encrypted_bytes = fernet.encrypt(data_bytes)
    return base64.urlsafe_b64encode(encrypted_bytes).decode('utf-8')

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """
    Decrypt sensitive data that was encrypted with encrypt_sensitive_data.
    
    Args:
        encrypted_data: Base64 encoded encrypted data
        
    Returns:
        str: Decrypted data
    """
    if encrypted_data is None:
        return None
    
    try:
        fernet = _get_fernet()
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
        decrypted_bytes = fernet.decrypt(encrypted_bytes)
        return decrypted_bytes.decode('utf-8')
    except Exception:
        # Return original data if decryption fails
        return encrypted_data

def encrypt_financial_data(amount: Union[str, float, int]) -> str:
    """
    Encrypt financial data like payment amounts.
    
    Args:
        amount: The financial amount to encrypt
        
    Returns:
        str: Base64 encoded encrypted data
    """
    return encrypt_sensitive_data(str(amount))

def decrypt_financial_data(encrypted_amount: str) -> str:
    """
    Decrypt financial data that was encrypted with encrypt_financial_data.
    
    Args:
        encrypted_amount: Base64 encoded encrypted data
        
    Returns:
        str: Decrypted data
    """
    return decrypt_sensitive_data(encrypted_amount)

def hash_sensitive_data(data: str) -> str:
    """
    Hash sensitive data for comparison without storing the original.
    
    Args:
        data: The data to hash
        
    Returns:
        str: SHA-256 hash of the data
    """
    import hashlib
    return hashlib.sha256(f"{data}{settings.SECRET_KEY}".encode()).hexdigest()

# Example usage:
# encrypted_phone = encrypt_sensitive_data("01234567890")
# decrypted_phone = decrypt_sensitive_data(encrypted_phone)
# hashed_id = hash_sensitive_data("student_123")
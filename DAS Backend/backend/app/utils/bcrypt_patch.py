"""
Patch for bcrypt compatibility with passlib
"""

import bcrypt

# Add the missing __about__ attribute to bcrypt module
# Using setattr to avoid type checking issues
if not hasattr(bcrypt, '__about__'):
    about_module = type('module', (), {
        '__version__': getattr(bcrypt, '__version__', 'unknown'),
        '__title__': getattr(bcrypt, '__title__', 'bcrypt'),
        '__summary__': getattr(bcrypt, '__summary__', 'Modern hashing for Python'),
        '__uri__': getattr(bcrypt, '__uri__', 'https://github.com/pyca/bcrypt'),
        '__author__': getattr(bcrypt, '__author__', 'The Python Cryptographic Authority developers'),
        '__email__': getattr(bcrypt, '__email__', 'cryptography-dev@python.org'),
        '__license__': getattr(bcrypt, '__license__', 'Apache License, Version 2.0'),
        '__copyright__': getattr(bcrypt, '__copyright__', 'Copyright 2013-2023 The Python Cryptographic Authority developers')
    })
    setattr(bcrypt, '__about__', about_module)
from multiprocessing.managers import BaseManager
from django.db import models
from django.contrib.auth.models import AbstractUser,PermissionsMixin,BaseUserManager
# Create your models here.
# class CustomUserManager(BaseUserManager):
   
#     def create_user(self, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError('The Email field must be set')
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, password=None, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('is_active', True)

#         if extra_fields.get('is_staff') is not True:
#             raise ValueError('Superuser must have is_staff=True.')
#         if extra_fields.get('is_superuser') is not True:
#             raise ValueError('Superuser must have is_superuser=True.')

#         return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('individual', 'Individual Client'),
        ('business_owner', 'Business Owner'),
        ('financial_advisor', 'Financial Advisor'),
        ('accountant', 'Accountant'),
        ('other', 'Other'),
    ]
    username = models.CharField(max_length=100, null=True, blank=True, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    

    # Django auth fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # objects = CustomUserManager()
    
    # USERNAME_FIELD = 'email'
    # REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number', 'company_name', 'role','username']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
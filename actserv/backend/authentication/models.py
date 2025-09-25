from multiprocessing.managers import BaseManager
from django.db import models
from django.contrib.auth.models import AbstractBaseUser,PermissionsMixin,UserManager
# Create your models here.

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('individual', 'Individual Client'),
        ('business_owner', 'Business Owner'),
        ('financial_advisor', 'Financial Advisor'),
        ('accountant', 'Accountant'),
        ('other', 'Other'),
    ]
    username = models.CharField(max_length=100, null=True, blank=True)
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

    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number', 'company_name', 'role']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('individual', 'Individual Client'),
        ('business_owner', 'Business Owner'),
        ('financial_advisor', 'Financial Advisor'),
        ('accountant', 'Accountant'),
        ('other', 'Other'),
    ]

    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)

   

    USERNAME_FIELD = 'username'  
   
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.username} | {self.role}"
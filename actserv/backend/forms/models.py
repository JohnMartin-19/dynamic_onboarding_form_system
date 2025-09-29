from django.db import models
from authentication.models import *

class Form(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_forms')
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        
    def __str__ (self):
        return self.name
    
class Field(models.Model):
    FIELD_TYPES = (
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('dropdown', 'Dropdown'),
        ('checkbox', 'Checkbox'),
        ('file', 'File Upload'),
    )

    CONDITIONAL_OPERATORS = (
        ('equal_to', 'Equal To'),
        ('greater_than', 'Greater Than'),
        ('less_than', 'Less Than'),
        ('not_equal_to', 'Not Equal To'),
    )

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='fields')
    name = models.CharField(max_length=255) 
    type = models.CharField(max_length=20, choices=FIELD_TYPES)
    options = models.JSONField(
        default=dict,
        blank=True,
        help_text="Stores validation rules or dropdown options e.g {'min': 1000, 'max': 100000} or ['Option1', 'Option2']"
    )
    is_required = models.BooleanField(default=False)
    order = models.IntegerField(default=0)  
    created_at = models.DateTimeField(auto_now_add=True)
    is_conditional = models.BooleanField(default=False, help_text="Set to True if this field's visibility depends on another field.")
    conditional_field = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='dependent_fields',
        help_text="The field (on the same form) that controls this field's visibility."
    )
    conditional_operator = models.CharField(
        max_length=20, 
        choices=CONDITIONAL_OPERATORS, 
        blank=True, 
        null=True
    )
    conditional_value = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text="The threshold value (e.g., '50000' or 'true')."
    )
   
    class Meta:
        unique_together = ("form","name")
        ordering = ['form','name']
        
    def __str__(self):
        return self.name
    
    
    
#holds/stores client data/submitted forms
class Submission(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='submissions')
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    data = models.JSONField(
        default=dict,
        help_text="Stores form responses, e.g., {'field_name': 'value', 'income': 50000}"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Submission for {self.form.name} by {self.user or 'Anonymous'}"

# Docs uploads 
class Document(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='documents')
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']
        
    def __str__(self):
        return f'{self.file} was uploaded at {self.uploaded_at}'
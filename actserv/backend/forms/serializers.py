from rest_framework import serializers
from .models import *

class FormSerializer(serializers.ModelSerializer):
    
    class Meta:
        models = Form
        fields = ['id','name','description','created_by','version',
                  'is_active','created_at','updated_at']
        
        
class FieldSerializer(serializers.ModelSerializer):
    
    class Meta:
        models = Field
        fields = ['id','form','name','type',
                  'options','is_required','order','created_at']
        
    
from rest_framework import serializers
from .models import *
from authentication.models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'company_name', 'role', 'is_active', 'is_staff', 'date_joined']
        read_only_fields = ['date_joined', 'is_active', 'is_staff']
class FormSerializer(serializers.ModelSerializer):
    created_by = CustomUserSerializer(read_only=True) 
    fields = serializers.SerializerMethodField()
    class Meta:
        models = Form
        fields = ['id','name','description','created_by','version',
                  'is_active','created_at','updated_at']
        read_only_fields = ['created_at','udated_at']
        
    def get_fields(self, obj):
        # Fetch related fields without causing recursion
        fields = obj.fields.all()
        return FieldSerializer(fields, many=True, context=self.context).data
class FieldSerializer(serializers.ModelSerializer):
    form = FormSerializer(read_only=True)
    class Meta:
        models = Field
        fields = ['id','form','name','type',
                  'options','is_required','order','created_at']
        read_only_fields = ['created_at']
        
    
class SubmissionSerializer(serializers.ModelSerializer):
    form = FormSerializer(read_only=True)
    user = CustomUserSerializer(read_only = True)
    documents = serializers.SerializerMethodField()
    class Meta:
        models = Submission
        fields = ['id','form','user','data',
                  'status','submitted_at','updated_at']
        read_only_fields = ['submitted_at','updated_at']
class DocumentSerializer(serializers.ModelSerializer):
    submission = SubmissionSerializer(read_only = True)
    field = FieldSerializer(read_only = True)
    class Meta:
        models = Document
        fields = ['id','submission','field','file','updated_at']
        read_only_fields = ['updated_at']
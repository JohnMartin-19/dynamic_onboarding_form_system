from rest_framework import serializers
from .models import *
from authentication.models import CustomUser


class CustomUserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'first_name', 'last_name', 'phone_number', 'company_name', 'role', 'is_active', 'is_staff', 'date_joined']
        read_only_fields = ['date_joined', 'is_active', 'is_staff']
    
class MinimalFormSerializer(serializers.ModelSerializer):
    """Serializer used inside FieldSerializer to prevent recursion."""
    class Meta:
        model = Form
        fields = ['id', 'name', 'version']    

class FormSerializer(serializers.ModelSerializer):
    created_by = CustomUserSerializer(read_only=True) 
    form_fields = serializers.SerializerMethodField()
    class Meta:
        model = Form
        fields = ['id','name','description','created_by','version',
                  'is_active','created_at','updated_at','form_fields']
        read_only_fields = ['created_at','updated_at']
        
    def get_form_fields(self, obj):
        fields = obj.fields.all()
        return FieldSerializer(fields, many=True, context=self.context).data
class FieldSerializer(serializers.ModelSerializer):
    form = serializers.SerializerMethodField(read_only=True) 
    
    class Meta:
        model = Field
        fields = ['id','form','name','type',
                  'options','is_required','order','created_at']
        read_only_fields = ['created_at']
    
    def get_form(self, obj):
        """
        Returns a partial representation of the Form using the MinimalFormSerializer.
        """
        form_instance = obj.form
        
        # Instantiate the minimal serializer and return its data
        return MinimalFormSerializer(form_instance, context=self.context).data

        

class DocumentSerializer(serializers.ModelSerializer):
   
    field_id = serializers.IntegerField(write_only = True)
    class Meta:
        model = Document
        fields = ['id','submission','field','field_id','file','updated_at']
        read_only_fields = ['updated_at']
  
class SubmissionSerializer(serializers.ModelSerializer):
    form = FormSerializer(read_only=True)
    user = CustomUserSerializer(read_only = True)
    documents = DocumentSerializer(many=True, required = False)
    form_id = serializers.IntegerField(write_only=True)
   
    class Meta:
        model = Submission
        fields = ['id','form','user','form_id','data',
                  'status','submitted_at','updated_at','documents']
        read_only_fields = ['submitted_at','updated_at']
        
    def create(self, validated_data):
        
        document_data = validated_data.pop('documents', [])
        form_id = validated_data.pop('form_id')
        user_instance = validated_data.pop('user')
        
        submission = Submission.objects.create(
            form_id=form_id,
            user=user_instance,
            **validated_data
        )
        
        for docs in document_data:
            field_id = docs.pop('field_id')
            Document.objects.create(
                submission=submission, 
                field_id=field_id,
                **docs
            )
            
        return submission

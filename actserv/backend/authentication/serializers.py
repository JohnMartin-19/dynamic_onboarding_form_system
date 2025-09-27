from rest_framework import serializers
from .models import *

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
   
    class Meta:
        model = CustomUser
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'company_name', 'role', 'password','username',
        ]

    
    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.get('username')
        user = CustomUser.objects.create_user(
            password=password,
            username = username, 
            **validated_data
        )
        return user
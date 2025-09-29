from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import transaction
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError


class UserRegistrationCreateListAPIView(APIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    def post(self,request):
        data = request.data
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        serializer = self.serializer_class(data = data)
        if password != confirm_password:
            data.pop('confirm_password')
            raise ValidationError({"password": "Passwords do not match"})
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                return Response({'message':'User Created Successfully', 
                                 'data':serializer.data}, status = status.HTTP_201_CREATED)
        print('ERROR:', serializer.errors)
        return Response({'message':'Failed to create user', 'data':serializer.errors}, status = status.HTTP_400_BAD_REQUEST)
                
    def get(self, request):
        users = CustomUser.objects.all()
        serializer = self.serializer_class(users, many = True)
        return Response({'message':'Success', 'data':serializer.data}, status = status.HTTP_200_OK)
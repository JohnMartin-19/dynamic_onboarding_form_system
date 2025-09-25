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
        # company_name = request.data.get("company_name")
        # email = request.data.get("email")
        # phone_number = request.data.get("phone_number")
        # username = request.data.get("username")
        # first_name = request.data.get('first_name')
        # last_name = request.data.get('last_name')
        
        serializer = self.serializer_class(data = data)
        if password != confirm_password:
            raise ValidationError({"password": "Passwords do not match"})
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                return Response({'message':'User Created Successfully', 
                                 'data':serializer.data}, status = status.HTTP_201_CREATED)
            return Response({'message':'Failed to create user', 'data':serializer.errors}, status = status.HTTP_400_BAD_REQUEST)
                
    def get(self, request):
        users = CustomUser.objects.all()
        serializer = self.serializer_class(users, many = True)
        return Response({'message':'Success', 'data':serializer.data}, status = status.HTTP_200_OK)
from django.shortcuts import render
from rest_framework.decorators import  permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import transaction
from rest_framework.permissions import AllowAny,IsAdmin
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404

class FormCreateListAPIView(APIView):
    """
    _FETCHING ALL FORMS_

    Args:
        APIView (_GET_): _Returns all the forms created by the admin_
        
    """
    serializer_class = FormSerializer
    
    def get(self, request):
        forms = Form.objects.all()
        serializer = self.serializer_class(forms, many = True)
        return Response({'message':'Success','data':serializer.data},status=status.HTTP_200_OK)
    
    """
    _Creating a FORM_

    Args:
        APIView (_POST_): _Lets the admin create a form _
        
    """
    @permission_classes([IsAdminUser])
    def post(self,request):
        data = request.data
        serializer = self.serializer_class(data = data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                return Response({'message':'Form created successfully','data':serializer.data},status = status.HTTP_201_CREATED)
            return Response({'message':'Failed to create form', 'data':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
class FormRetrieveUpdateDestroyAPIView(APIView):
    """
    helper method for getting a particular form by id
    """
    serializer_class = FormSerializer
    def get_object(self, request,pk):
        return get_object_or_404(pk=pk)
    
    def get(self, request,pk):
        form = self.get_object(pk)
        serializer = self.serializer_class(form)
        return Response({'message':'Success', 'data':serializer.data}, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        form = self.get_object(pk)
        serializer = self.serializer_class(form, data = request.data, partial = True)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                return Response({'message':'Form updated successfully','data':serializer.data}, status=status.HTTP_200_OK)
            return Response({'mesage':'Failed to update form', 'data':serializer.errors},status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, pk):
        form = self.get_object(pk)
        form.delete()
        return Response({'message':'Form delete successfully'},status=status.HTTP_204_NO_CONTENT)
    
class FieldCreatelistAPIView(APIView):
    """
    API view to create and list all form fields
    """
    serializer_class = FieldSerializer
    
    def get(self, request):
        fields = Field.objects.all()
        serializer = self.serializer_class(fields, many=True)
        return Response({'message':'Success','data':serializer.data}, status=status.HTTP_200_OK)
    
    @permission_classes([IsAdminUser])
    def post(self, request):
        data = request.data
        serializer = self.serializer_class(data = data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save()
                return Response({'message':'Field created successfully', 'data':serializer.data}, status=status.HTTP_201_CREATED)
            return Response({'message':'Failed to create field', 'data':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        
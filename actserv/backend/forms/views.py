from django.shortcuts import render
# Removed: from rest_framework.decorators import permission_classes (used for FBVs, not CBVs like APIView)
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .models import *
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .tasks import *

class FormCreateListAPIView(APIView):
    """
    FETCHING ALL FORMS 
    """
    serializer_class = FormSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get(self, request):

        forms = Form.objects.all()
        serializer = self.serializer_class(forms, many = True)
        return Response({'message':'Success','data':serializer.data},status=status.HTTP_200_OK)
    
    """
        APIView (_POST_): _Lets the admin create a form _  
    """
    
    def post(self,request):

        data = request.data
        serializer = self.serializer_class(data = data)
        if serializer.is_valid():
            with transaction.atomic():
                serializer.save(created_by=request.user) 
                return Response({'message':'Form created successfully','data':serializer.data},status = status.HTTP_201_CREATED)
       
        return Response({'message':'Failed to create form', 'data':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
class FormRetrieveUpdateDestroyAPIView(APIView):
    """
    helper method for getting a particular form by id
    """
    serializer_class = FormSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsAdminUser()]
        return [AllowAny()] # Allow GET requests (retrieve) for anyone
    
    def get_object(self, pk):
        return get_object_or_404(Form, pk=pk)

    def get(self, request, pk):
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
      
        return Response({'message':'Failed to update form', 'data':serializer.errors},status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, pk): 
       
        form = self.get_object(pk)
        form.delete()
        return Response({'message':'Form delete successfully'},status=status.HTTP_204_NO_CONTENT)


class FieldCreateListAPIView(APIView):
    """
    API view to create and list all form fields
    """
    serializer_class = FieldSerializer
    
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get(self, request):
        fields = Field.objects.all()
        serializer = self.serializer_class(fields, many=True)
        return Response({'message':'Success','data':serializer.data}, status=status.HTTP_200_OK)
    
   
    def post(self, request):
        data = request.data
        serializer = self.serializer_class(data = data)
        if serializer.is_valid():
            with transaction.atomic():
                form_instance = get_object_or_404(Form, pk=data.get('form'))

                serializer.save(form = form_instance) 
                return Response({'message':'Field created successfully', 'data':serializer.data}, status=status.HTTP_201_CREATED)
        
        return Response({'message':'Failed to create field', 'data':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
class FieldRetrieveUpdateDestroyAPIView(APIView):
    
    serializer_class = FieldSerializer
    
    def get_object(self, pk):
        return get_object_or_404(Field,pk=pk)
 
    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsAdminUser()]
        return [AllowAny()] 
    
    def get(self, request,pk):
        field = self.get_object(pk)
        serializer = self.serializer_class(field)
        return Response({'message':'Success', 'data':serializer.data}, status = status.HTTP_200_OK)
    
    def put(self,request, pk):
        field = self.get_object(pk)
        serializer = self.serializer_class(field,data = request.data,partial = True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'Field updated successfully', 'data':serializer.data}, status = status.HTTP_200_OK)
        return Response({'message':'Failed to update the field', 'data':serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request, pk):
        field = self.get_object(pk)
        field.delete()
        return Response({'message':'Field deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


class SubmissionCreateListAPIView(APIView):
    
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]
   
    def get(self, request):
        submissions = Submission.objects.all()
        serializer = self.serializer_class(submissions, many = True)
        return Response({'message':'Success', 'data':serializer.data}, status=status.HTTP_200_OK)
   
    def post(self, request):
       
        data = request.data
        serializer_input_data = {
            'form_id': data.get('form_id'),
            'data': data.get('data') 
        }
        serializer = self.serializer_class(data=serializer_input_data, context={'request': request})
        file_fields_to_process = {}
        if 'Image' in data:  
            file_fields_to_process['Image'] = data.getlist('Image')
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    submission = serializer.save(user=request.user)
                    for field_name, uploaded_files in file_fields_to_process.items():
                        try:
                            form_field_instance = Field.objects.get(
                                form_id=submission.form_id, 
                                name=field_name
                            )
                        except Field.DoesNotExist:
                            print(f"Warning: Field with name '{field_name}' not found for form ID {submission.form_id}")
                            continue

                        for uploaded_file in uploaded_files:
                            Document.objects.create(
                                submission=submission,
                                field=form_field_instance,
                                file=uploaded_file
                            )
                    notify_admin_of_submission.delay(
                        submission_id=submission.id,
                        form_name=submission.form.name, 
                        client_email=request.user.email
                    )
                           
                    return Response(
                        {'message': 'Form submitted successfully', 'data': serializer.data}, 
                        status=status.HTTP_201_CREATED
                    )
            
            except Exception as e:
                
                return Response(
                    {'message': 'Failed to submit form due to internal validation error.', 
                     'data': {'form_id': [f"Object does not exist or invalid data: {str(e)}"]}}, # <-- ADDED 'data' KEY for error details
                    status=status.HTTP_400_BAD_REQUEST 
                )
        return Response(
            {'message': 'Failed to submit form', 'data': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
class SubmissionRetrieveUpdateDestroyAPIView(APIView):
    
    serializer_class = SubmissionSerializer
    
    
    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_object(self, pk):
        return get_object_or_404(Submission,pk=pk)
    
    def get(self, request, pk):
        submission = self.get_object(pk)
        serializer = self.serializer_class(submission)
        return Response({'message':'Success', 'data':serializer.data}, status = status.HTTP_200_OK)
    
    def delete(self,request,pk):
        submission = self.get_object(pk)
        submission.delete()
        return Response({'message':'Submission deleted successfully'}, status = status.HTTP_204_NO_CONTENT)
        

class MySubmissions(APIView):
    """
    logs all the submissions made by a logged in user
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SubmissionSerializer
    def get(self,request):
        
        my_submissions = Submission.objects.filter(user =request.user)
        serializer = self.serializer_class(my_submissions, many = True)
        return Response({'message':'Success','data':serializer.data}, status=status.HTTP_200_OK)
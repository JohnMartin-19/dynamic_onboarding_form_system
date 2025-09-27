from django.shortcuts import render
from rest_framework.decorators import  permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
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
    
class FieldCreateListAPIView(APIView):
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
        
class FieldRetrieveUpdateDestroyAPIView(APIView):
    
    serializer_class = FieldSerializer
    
    def get_object(self, request, pk):
        return get_object_or_404(pk=pk)
    
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
    
    def delete(self, pk):
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
        print('DATAAAA:', data)
        
        # 1. Safely extract non-file data for the SubmissionSerializer
        # We create a new dictionary containing only the keys the serializer needs (form_id, data)
        # request.data.get() safely retrieves only the value without deep-copying file handlers.
        serializer_input_data = {
            'form_id': data.get('form_id'),
            'data': data.get('data') 
            # Add any other non-file fields your SubmissionSerializer needs
        }

        serializer = self.serializer_class(data=serializer_input_data, context={'request': request})
        
        # 2. Prepare to extract file fields separately
        # DRF's request.data['key'] is safe to use for file fields.
        file_fields_to_process = {}
        
        # NOTE: We can't use request.data.keys() because we need to check if the value is a file.
        # We'll use the specific field name 'Image' based on your QueryDict:
        if 'Image' in data:
            # request.data.getlist('Image') is safer for QueryDicts/MultiValueDicts
            file_fields_to_process['Image'] = data.getlist('Image') 
            # You would add similar checks for other potential file fields (e.g., 'PDF')

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # 3. Save the Submission (handles form_id and JSON 'data' field)
                    submission = serializer.save(user=request.user) 
                    
                    # 4. Handle File Uploads and create Document entries
                    for field_name, uploaded_files in file_fields_to_process.items():
                        
                        # Find the Field object corresponding to the name ('Image')
                        try:
                            # IMPORTANT: Ensure 'Image' exists in your Field model for this form
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
                            
                    # Trigger async task
                    # notify_admin_of_submission.delay(submission.pk, submission.form.name, request.user.email)
                    
                    return Response(
                        {'message': 'Form submitted successfully', 'data': serializer.data}, 
                        status=status.HTTP_201_CREATED
                    )
            except Exception as e:
                # Catch specific exceptions (e.g., IntegrityError) for better error messages
                return Response(
                    {'message': 'An internal error occurred during submission', 'error': str(e)}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # 5. Return validation errors
        return Response(
            {'message': 'Failed to submit form', 'data': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
class SubmissionRetirieveUpdateDestroyAPIView(APIView):
    
    serializer_class = SubmissionSerializer
    
    def get_object(self, request, pk):
        return get_object_or_404(pk=pk)
    
    def get(self, request, pk):
        submission = self.get_object(pk)
        serializer = self.serializer_class(submission)
        return Response({'message':'Success', 'data':serializer.data}, status = status.HTTP_200_OK)
    
    def delete(self,pk):
        submission = self.get_object(pk)
        submission.delete()
        return Response({'message':'Submission deleted successfully'}, status = status.HTTP_204_NO_CONTENT)
        

class MySubmissions(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SubmissionSerializer
    def get(self,request):
        
        my_submissions = Submission.objects.filter(user =request.user)
        serializer = self.serializer_class(my_submissions)
        return Response({'message':'Success','data':serializer.data}, status=status.HTTP_200_OK)
from django.urls import path
from .views import *

urlpatterns = [
    path('forms/', FormCreateListAPIView.as_view(), name='form-list-create'),
    path('forms/<int:pk>/', FormRetrieveUpdateDestroyAPIView.as_view(), name='form-retrieve-update-destroy'),
    path('fields/', FieldCreateListAPIView.as_view(), name='field-list-create'),
    path('fields/<int:pk>/', FieldRetrieveUpdateDestroyAPIView.as_view(), name='field-retrieve-update-destroy'), 
    path('submissions/', SubmissionCreateListAPIView.as_view(), name='submission-list-create'),
    path('submissions/<int:pk>/', SubmissionRetrieveUpdateDestroyAPIView.as_view(), name='submission-retrieve-update-destroy'),   
    path('my_submissions/', MySubmissions.as_view(), name='my-submissions'),
]
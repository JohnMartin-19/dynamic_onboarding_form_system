from django.urls import path
from .views import *

urlpatterns = [
    path('forms/', FormCreateListAPIView.as_view(), name= 'Create and List Forms'),
    path('forms/<int:pk>/', FormRetrieveUpdateDestroyAPIView.as_view(), name = 'Edit/Delete/Update Form'),
    path('fields/', FieldCreateListAPIView.as_view(), name = 'Create and List Fields'),
    path('fields/<int:pk>/', FieldRetrieveUpdateDestroyAPIView.as_view(), name = 'Edit/Update/Delete Fields'),
    path('submissions/', SubmissionCreateListAPIView.as_view(), name = 'Create and List Submissions'),
    path('submissions/<int:pk>/', SubmissionRetirieveUpdateDestroyAPIView.as_view(), name = 'Edit/Delete Submissions'),
    path('my_submissions/', MySubmissions.as_view(), name = 'View your submissions'),
]
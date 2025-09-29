from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Form, Field, Submission, Document 
import datetime 
from unittest import mock
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile

from .tasks import notify_admin_of_submission 

CustomUser = get_user_model()


class FormModelTest(TestCase):
    """Tests for the Form model."""

    def setUp(self):

        self.user = CustomUser.objects.create_user(
            username='testadmin', 
            email='admin@example.com', 
            password='password123',
            is_staff=True
        )
        self.form = Form.objects.create(
            name='KYC Application',
            description='Know Your Customer form.',
            created_by=self.user
        )

    def test_form_creation(self):
        """Test that a Form object is created correctly."""
        self.assertEqual(self.form.name, 'KYC Application')
        self.assertEqual(self.form.created_by, self.user)
        self.assertEqual(self.form.version, 1)
        self.assertTrue(self.form.is_active)
        self.assertIsNotNone(self.form.created_at)
        self.assertEqual(str(self.form), 'KYC Application')

    def test_unique_name_constraint(self):
        """Test that form names must be unique."""
       
        with self.assertRaises(IntegrityError):
            Form.objects.create(name='KYC Application') 
    def test_form_deletion_and_user_nullification(self):
        """Test what happens when the creator user is deleted (should set created_by to NULL)."""
        self.user.delete()
        self.form.refresh_from_db()
        self.assertIsNone(self.form.created_by)


# --------------------------------------------------------------------------------------------------

class FieldModelTest(TestCase):
    """Tests for the Field model."""

    def setUp(self):
        self.form = Form.objects.create(name='Loan Application')
        self.field = Field.objects.create(
            form=self.form,
            name='loan_amount',
            type='number',
            is_required=True,
            options={'min': 50000, 'max': 500000},
            order=1
        )

    def test_field_creation(self):
        """Test that a Field object is created correctly with all attributes."""
        self.assertEqual(self.field.form, self.form)
        self.assertEqual(self.field.name, 'loan_amount')
        self.assertEqual(self.field.type, 'number')
        self.assertTrue(self.field.is_required)
        self.assertIsInstance(self.field.options, dict)
        self.assertEqual(self.field.options['min'], 50000)
        self.assertEqual(str(self.field), 'loan_amount')

    def test_field_type_choices(self):
        """Test that only valid field types can be assigned."""
        valid_types = [choice[0] for choice in Field.FIELD_TYPES]
        self.assertIn(self.field.type, valid_types)

    def test_unique_name_per_form_constraint(self):
        """Test that two fields under the same form cannot have the same name."""
       
        with self.assertRaises(IntegrityError):
            Field.objects.create(
                form=self.form,
                name='loan_amount', 
                type='text' 
            )
        
   
    def test_same_field_name_allowed_on_different_form(self):
        """Test that the same field name is allowed under a different form."""
        initial_count = Field.objects.count()
        new_form = Form.objects.create(name='Credit Check')
        Field.objects.create(
            form=new_form,
            name='loan_amount', 
            type='number'
        )
        self.assertEqual(Field.objects.count(), initial_count + 1)


# --------------------------------------------------------------------------------------------------

class SubmissionModelTest(TestCase):
    """Tests for the Submission model."""

    def setUp(self):
       
        self.user = CustomUser.objects.create_user(
            username='testclient',
            email='client@example.com', 
            password='password123'
        )
        self.form = Form.objects.create(name='Investment Declaration')
      
        self.submission = Submission.objects.create(
            form=self.form,
            user=self.user,
            data={'investment_type': 'stocks', 'amount': 15000},
            status='pending',
            submitted_at='2025-01-01T09:00:00Z' 
        )

    def test_submission_creation(self):
        """Test that a Submission object is created correctly."""
        self.assertEqual(self.submission.form, self.form)
        self.assertEqual(self.submission.user, self.user)
        self.assertEqual(self.submission.status, 'pending')
        self.assertEqual(self.submission.data['amount'], 15000)
        self.assertIsNotNone(self.submission.submitted_at)
        self.assertIn(self.submission.status, [c[0] for c in Submission.STATUS_CHOICES])
        self.assertIn(str(self.submission), f"Submission for Investment Declaration by {str(self.user)}")

    def test_submission_ordering(self):
        """Test that submissions are ordered by most recently submitted (DESC)."""
       
        s2 = Submission.objects.create(
            form=self.form, 
            user=self.user, 
            submitted_at='2025-01-01T11:00:00Z'
        )
        s3 = Submission.objects.create(
            form=self.form, 
            user=self.user,
            submitted_at='2025-01-01T12:00:00Z' 
        )
        
       
        all_submissions = Submission.objects.all()
        
      
        self.assertEqual(all_submissions[0], s3) 
        self.assertEqual(all_submissions[1], s2) 
        self.assertEqual(all_submissions[2], self.submission)

    def test_anonymous_submission(self):
        """Test submission where the user is optional (blank=True, null=True)."""
        anon_submission = Submission.objects.create(
            form=self.form,
            user=None,
            data={'name': 'Anon User'}
        )
        self.assertIsNone(anon_submission.user)
        self.assertIn('Anonymous', str(anon_submission))


# --------------------------------------------------------------------------------------------------

class DocumentModelTest(TestCase):
    """Tests for the Document model."""

    def setUp(self):
       
        self.user = CustomUser.objects.create_user(
            username='docclient',
            email='client@example.com', 
            password='password123'
        )
        self.form = Form.objects.create(name='File Upload Form')
        self.field = Field.objects.create(
            form=self.form,
            name='income_proof',
            type='file'
        )
        self.submission = Submission.objects.create(
            form=self.form,
            user=self.user,
            data={}
        )
    
        self.file_content = b'This is test content.'
        self.mock_file = SimpleUploadedFile(
            "test_doc.pdf",
            self.file_content,
            content_type="application/pdf"
        )
        
        self.document = Document.objects.create(
            submission=self.submission,
            field=self.field,
            file=self.mock_file
        )

    def test_document_creation(self):
        """Test that a Document object is created and file storage is referenced."""
        self.assertEqual(self.document.submission, self.submission)
        self.assertEqual(self.document.field, self.field)
        
       
        self.assertIn('uploads', self.document.file.name)

        self.assertTrue(self.document.file.size > 0)
        
        self.assertIsNotNone(self.document.uploaded_at)

    def test_file_field_upload_path(self):
        """Test that the upload_to path is correctly generated (containing year/month/day)."""
        today = datetime.date.today()
        expected_path_segment = f'uploads/{today.year}/{today.month:02d}/{today.day:02d}'
        
        self.assertIn(expected_path_segment, self.document.file.name)
        
    def test_document_str_method(self):
        """Test the string representation of the Document model."""
        self.assertIn('was uploaded at', str(self.document))

    def test_related_name_access(self):
        """Test forward and reverse relationships are set up correctly."""
        self.assertIn(self.document, self.submission.documents.all())
        self.assertIn(self.document, self.field.documents.all())
        
        
        
#--------------------------------------------------------------------------------------------------------------------------------
# API TESTS

class BaseAPITestSetup(APITestCase):
    """Setup base users and initial objects for API testing."""
    def setUp(self):
       
        self.admin_user = CustomUser.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpassword',
            is_staff=True,
            is_superuser=True
        )
        self.regular_user = CustomUser.objects.create_user(
            username='regular_test',
            email='regular@test.com',
            password='testpassword',
            is_staff=False
        )

        self.form = Form.objects.create(
            name='Test Form',
            created_by=self.admin_user
        )
        self.field_text = Field.objects.create(
            form=self.form,
            name='name_field',
            type='text'
        )
        self.field_file = Field.objects.create(
            form=self.form,
            name='Image',
            type='file'
        )
        self.submission_data = {
            'form_id': self.form.id,
            'data': {'name_field': 'John Doe'}
        }

        self.form_list_url = reverse('form-list-create')
        self.field_list_url = reverse('field-list-create')
        self.submission_list_url = reverse('submission-list-create')
        self.my_submissions_url = reverse('my-submissions')

    def authenticate_user(self, user):
        """Helper to authenticate the client."""
        self.client.force_authenticate(user=user)
        
        
class FormAPITest(BaseAPITestSetup):
    """Tests for FormCreateListAPIView and FormRetrieveUpdateDestroyAPIView."""

    def test_list_forms_unauthenticated(self):
        """Anyone can list forms."""
        response = self.client.get(self.form_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)

    def test_create_form_as_admin(self):
        """Admin user can create a form."""
        self.authenticate_user(self.admin_user)
        new_form_data = {'name': 'New Loan Form', 'description': 'Loan application'}
        response = self.client.post(self.form_list_url, new_form_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Form.objects.count(), 2)

    def test_create_form_as_regular_user_denied(self):
        """Regular user cannot create a form (IsAdminUser check)."""
        self.authenticate_user(self.regular_user)
        new_form_data = {'name': 'Denied Form'}
        response = self.client.post(self.form_list_url, new_form_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN) 
        self.assertEqual(Form.objects.count(), 1)

  
    def test_update_form_as_admin(self):
        """Admin can update an existing form."""
        self.authenticate_user(self.admin_user)
        url = reverse('form-retrieve-update-destroy', kwargs={'pk': self.form.id})
        update_data = {'description': 'Updated Description', 'version': 2}
        response = self.client.put(url, update_data, format='json')
        self.form.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.form.description, 'Updated Description')
        self.assertEqual(self.form.version, 2)

    def test_delete_form_as_admin(self):
        """Admin can delete a form."""
        self.authenticate_user(self.admin_user)
        url = reverse('form-retrieve-update-destroy', kwargs={'pk': self.form.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Form.objects.count(), 0)
        
    def test_delete_form_as_regular_user_denied(self):
        """Regular user cannot delete a form (IsAdminUser check, assumed via default permissions)."""
        self.authenticate_user(self.regular_user)
        url = reverse('form-retrieve-update-destroy', kwargs={'pk': self.form.id})
        response = self.client.delete(url)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_405_METHOD_NOT_ALLOWED])
        self.assertEqual(Form.objects.count(), 1)


class FieldAPITest(BaseAPITestSetup):
    """Tests for FieldCreateListAPIView."""

    def test_list_fields(self):
        """Anyone can list fields."""
        response = self.client.get(self.field_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2) # text and file fields from setup

    def test_create_field_as_admin(self):
        """Admin user can create a field."""
        self.authenticate_user(self.admin_user)
        new_field_data = {
            'form': self.form.id,
            'name': 'age',
            'type': 'number',
            'is_required': True
        }
        response = self.client.post(self.field_list_url, new_field_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Field.objects.count(), 3)

    def test_create_field_as_unauthenticated_denied(self):
        """Unauthenticated user cannot create a field."""
        new_field_data = {
            'form': self.form.id,
            'name': 'age',
            'type': 'number'
        }
        response = self.client.post(self.field_list_url, new_field_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Field.objects.count(), 2)


class SubmissionAPITest(BaseAPITestSetup):
    """Tests for SubmissionCreateListAPIView and MySubmissions."""

    def setUp(self):
        super().setUp()
        self.authenticate_user(self.regular_user)
        self.form_id = self.form.id

    def test_list_all_submissions_authenticated(self):
        """Authenticated users can see all submissions (Assumed Admin logic or project requirement)."""
        Submission.objects.create(form=self.form, user=self.regular_user, data={'name_field': 'User1'})
        Submission.objects.create(form=self.form, user=self.admin_user, data={'name_field': 'Admin1'})
        
        response = self.client.get(self.submission_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2) 
        
    def test_list_all_submissions_unauthenticated_denied(self):
        """Unauthenticated users cannot list all submissions (IsAuthenticated check)."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.submission_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_list_my_submissions(self):
        """Authenticated users can list only their own submissions."""
        Submission.objects.create(form=self.form, user=self.regular_user, data={'name_field': 'My Data'})
        Submission.objects.create(form=self.form, user=self.admin_user, data={'name_field': 'Other Data'})
        
        response = self.client.get(self.my_submissions_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['user']['id'], self.regular_user.id)
   
    @mock.patch('forms.views.notify_admin_of_submission')
    def test_create_submission_with_data(self, mock_celery_task):
        """Authenticated user can submit a form with only data."""
        response = self.client.post(self.submission_list_url, self.submission_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.count(), 1)
        self.assertEqual(Submission.objects.first().user, self.regular_user)
      
        mock_celery_task.delay.assert_called_once()
        
    @mock.patch('forms.views.notify_admin_of_submission')
    def test_create_submission_with_file_upload(self, mock_celery_task):
        """Authenticated user can submit a form with data and a file."""
        
        mock_file = SimpleUploadedFile(
            "test_image.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        
        payload = {
            'form_id': self.form_id,
            'data': '{"name_field": "File User"}', 
            'Image': mock_file 
        }
        
        response = self.client.post(self.submission_list_url, payload, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Submission.objects.count(), 1)
        self.assertEqual(Document.objects.count(), 1)
        self.assertIn('uploads', Document.objects.first().file.name)
       
        mock_celery_task.delay.assert_called_once()

    def test_create_submission_unauthenticated_denied(self):
        """Unauthenticated user cannot submit a form (IsAuthenticated check)."""
        self.client.force_authenticate(user=None)
        response = self.client.post(self.submission_list_url, self.submission_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Submission.objects.count(), 0)

    def test_create_submission_invalid_data(self):
        """Submission with invalid data (e.g., missing form_id) is denied."""
        invalid_data = self.submission_data.copy()
        invalid_data['form_id'] = 9999 
        response = self.client.post(self.submission_list_url, invalid_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('form_id', response.data['data'])
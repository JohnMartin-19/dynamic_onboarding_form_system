from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Form, Field, Submission, Document 
import datetime # Needed for document path test


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
            submitted_at='2025-01-01T12:00:00Z' # Newest
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
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError as DBIntegrityError
from django.core.exceptions import ImproperlyConfigured
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
CustomUser = get_user_model()

class CustomUserModelTest(TestCase):

    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpassword',
            'role': 'individual',
        }
        self.admin_data = {
            'username': 'adminuser',
            'email': 'admin@example.com',
            'first_name': 'Admin',
            'last_name': 'Boss',
            'password': 'adminpassword',
            'role': 'financial_advisor',
            'is_staff': True,
            'is_superuser': True,
        }

    def test_create_regular_user(self):
        """Ensures a regular user is created correctly with all fields."""
        user = CustomUser.objects.create_user(**self.user_data)
        
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.check_password('testpassword'))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.role, 'individual')
       
        self.assertIn(user.phone_number, [None, '']) 

    def test_create_superuser(self):
        """Ensures a superuser is created correctly with staff/superuser flags."""
        user = CustomUser.objects.create_superuser(**self.admin_data)
        
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, 'financial_advisor')

    def test_str_representation(self):
        """Tests the __str__ method returns the correct format."""
        user = CustomUser.objects.create_user(**self.user_data)
        expected_str = f"{self.user_data['username']} | {self.user_data['role']}"
        self.assertEqual(str(user), expected_str)

    def test_username_is_unique(self):
        """Ensures username is enforced as unique."""
        CustomUser.objects.create_user(**self.user_data)
        
        duplicate_data = self.user_data.copy()
        duplicate_data['email'] = 'new@example.com' 
        
        with self.assertRaises(DBIntegrityError):
            CustomUser.objects.create_user(**duplicate_data)

    def test_email_is_unique(self):
        """Ensures email is enforced as unique."""
        CustomUser.objects.create_user(**self.user_data)
        
        duplicate_data = self.user_data.copy()
        duplicate_data['username'] = 'anotheruser' 
        
        with self.assertRaises(DBIntegrityError):
            CustomUser.objects.create_user(**duplicate_data)
            
    def test_email_can_be_null(self):
        """Ensures email field can be set to None (null=True)."""
        data = self.user_data.copy()
        data['email'] = None
        user = CustomUser.objects.create_user(**data)
        
        self.assertEqual(user.email, '') 

    def test_required_fields_enforced(self):
        """
        Tests that fields missing during create_user are saved as empty strings 
        if the model allows them to be blank=True.
        """
        invalid_data = self.user_data.copy()
        del invalid_data['first_name']
        del invalid_data['last_name']
        try:
            user = CustomUser.objects.create_user(**invalid_data)
        except Exception:
            self.fail("User creation should not raise an exception when required fields are omitted if they allow blank=True.")
        
       
        self.assertEqual(user.first_name, '', "Missing first_name should default to an empty string.")
        self.assertEqual(user.last_name, '', "Missing last_name should default to an empty string.")
    
    def test_role_choices(self):
        """Ensures saving an invalid choice for 'role' raises a ValidationError."""
        user = CustomUser.objects.create_user(**self.user_data)
        user.role = 'invalid_role_type'
        
        with self.assertRaises(ValidationError):
            user.full_clean() 

    def test_role_default(self):
        """
        Tests the actual behavior of the 'role' field when omitted, 
        which results in an empty string 'default' if not in REQUIRED_FIELDS.
        """
        user_data = self.user_data.copy()
        del user_data['role']
        
        user = CustomUser.objects.create_user(**user_data)
        self.assertEqual(user.role, '')
        
        
        
        
#_-------------------------------------_-------__--______-------____--------_____-------___----____----
USER_REGISTRATION_LIST_URL = reverse('user-register') 

class UserRegistrationAPITest(APITestCase):

    def setUp(self):
       
        self.admin_user = CustomUser.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            first_name='Admin',
            last_name='User',
            password='adminpassword',
            role='financial_advisor'
        )
        self.base_data = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'first_name': 'New',
            'last_name': 'Tester',
            'password': 'StrongPassword123!',
            'confirm_password': 'StrongPassword123!',
            'role': 'individual',
        }
        self.list_url = USER_REGISTRATION_LIST_URL

    def test_successful_user_registration(self):
        """Test that a user can register successfully with valid data and matching passwords."""
        
        response = self.client.post(self.list_url, self.base_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertEqual(response.data['message'], 'User Created Successfully')
        self.assertIn('data', response.data)

        self.assertTrue(CustomUser.objects.filter(username='newuser').exists())
        
       
        user = CustomUser.objects.get(username='newuser')
        self.assertTrue(user.check_password(self.base_data['password']))
        
       
        self.assertNotIn('password', response.data['data'])
        self.assertNotIn('confirm_password', response.data['data']) # Corrected target from self.base_data


    def test_registration_password_mismatch_denied(self):
        """Test that registration fails if password and confirm_password do not match."""
        mismatch_data = self.base_data.copy()
        mismatch_data['confirm_password'] = 'WrongPassword456!'
        
        response = self.client.post(self.list_url, mismatch_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
       
        self.assertIn('password', response.data)
        self.assertIn('Passwords do not match', response.data['password'])

        self.assertFalse(CustomUser.objects.filter(username='newuser').exists())

    def test_registration_missing_required_field_denied(self):
        """Test that registration fails if a required field (e.g., username) is missing."""
        invalid_data = self.base_data.copy()
        del invalid_data['username']
        response = self.client.post(self.list_url, invalid_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
        self.assertIn('username', response.data['data'])
        
       
        self.assertEqual(CustomUser.objects.count(), 1) 

    def test_registration_duplicate_username_denied(self):
        """Test that registration fails if the username already exists."""
        
       
        orm_data = self.base_data.copy()
        del orm_data['confirm_password']
        orm_data['password'] = 'y' 
        CustomUser.objects.create_user(**orm_data)
        
       
        duplicate_data = self.base_data.copy()
        
        response = self.client.post(self.list_url, duplicate_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('data', response.data)
        self.assertIn('username', response.data['data'])


    def test_list_users_anonymous_allowed(self):
        """Test that an anonymous user can list all users (due to AllowAny)."""
        
        CustomUser.objects.create_user(
            username='user2', 
            email='user2@test.com', 
            first_name='Second', 
            last_name='User', 
            password='test', 
            role='individual'
        )
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)

        self.assertEqual(CustomUser.objects.count(), 2) 
        self.assertEqual(len(response.data['data']), 2) 

        first_user = response.data['data'][0]
        self.assertIn('username', first_user)
        self.assertIn('role', first_user)




from celery import shared_task
from django.core.mail import mail_admins
from django.urls import reverse

@shared_task
def notify_admin_of_submission(submission_id: int, form_name: str, client_email: str):
    """
    Sends an email notification to the site administrators.
    """
   
    admin_url_path = reverse('admin:forms_submission_change', args=[submission_id])
    admin_full_url = f"http://127.0.0.1:8001{admin_url_path}" 

    subject = f" NEW FORM SUBMISSION: {form_name}"
    message = (
        f"Dear Sys Admin;\n\n"
        f"A new form submission has been received from {client_email}.\n\n"
        f"Form Name: {form_name}\n"
        f"Submission ID: {submission_id}\n\n"
        f"Review it here: {admin_full_url}"
    )

    # mail_admins  (a convenient Django shortcut that sends email to all ADMINS defined in settings.py)
    mail_admins(
        subject, 
        message, 
        fail_silently=False
    )
    return f"Admin notification sent for Submission ID: {submission_id}"
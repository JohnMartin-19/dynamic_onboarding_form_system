from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.urls import reverse
from django.conf import settings


@shared_task
def notify_admin_of_submission(submission_id: int, form_name: str, client_email: str):
    """
    Sends an email notification to the site administrators.
    """

    admin_url_path = reverse('admin:forms_submission_change', args=[submission_id])
    admin_full_url = f"http://127.0.0.1:8001{admin_url_path}" 

    subject = f"New Form Submission: {form_name}"

    text_content = (
        f"Dear Sys Admin,\n\n"
        f"A new form submission has been received from {client_email}.\n\n"
        f"Form Name: {form_name}\n"
        f"Submission ID: {submission_id}\n\n"
        f"Review it here: {admin_full_url}"
    )

    # HTML body
    html_content = f"""
    <html>
        <body>
            <p>Dear Sys Admin,</p>
            <p>A new form submission has been received from <b>{client_email}</b>.</p>
            <p>
                <b>Form Name:</b> {form_name}<br>
                <b>Submission ID:</b> {submission_id}
            </p>
            <p>
                <a href="{admin_full_url}" style="background-color:#4CAF50;color:white;
                padding:10px 15px;text-decoration:none;border-radius:5px;">
                    Review Submission
                </a>
            </p>
        </body>
    </html>
    """

    from_email = f"Onboarding Form System <{settings.DEFAULT_FROM_EMAIL}>"
    to_emails = [email for _, email in settings.ADMINS]

    msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails)
    msg.attach_alternative(html_content, "text/html")
    msg.send()

    return f"Admin notification sent for Submission ID: {submission_id}"

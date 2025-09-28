Creative Dynamic Onboarding Form System
A flexible, secure, and scalable Dynamic Form Platform built for financial services firms to manage customer onboarding (KYC, loans, investments) with full compliance and operational agility.

## Features
** 💻 Client Portal & Submission **
Dynamic Form Rendering - Clients see forms generated on-the-fly based on the Admin's configuration, including conditional fields.

Double Submission Prevention - Forms are instantly marked as completed and disabled on the client dashboard after submission to prevent double entry.

Secure Access (JWT) - All client actions (viewing forms, submitting data, viewing history) are protected by JSON Web Token (JWT) authentication.

Submission History - A dedicated tab allows clients to view all their submitted forms and their current status.

⚙️ Administrative Agility
Admin Setup (Jazzmin) - Uses a customized Django Admin (Jazzmin UI) for a clean, agile way for non-developers to create and manage forms and fields.

API-First Configuration - Admins define form structure and rules using the system's underlying API model, supporting complex business logic without code changes.

Role-Based Access - Admin endpoints (CRUD on forms/fields, viewing all submissions) are protected by IsAdminUser permissioning.

💾 Data & File Management
JSONB Flexibility - Submission data is stored in PostgreSQL JSONB fields, ensuring that old submissions remain intact even when the form structure evolves over time.

Cloud File Offloading - Large client documents (ID, proof of income) are stored in AWS S3 to prevent database bloat, ensuring high performance and data durability.

Auditability - Submission records track which form version was used, aiding compliance and auditing.

🔔 Asynchronous Workflow
Instant Client Feedback - Uses toast.success for non-intrusive, immediate success notifications upon submission.

Decoupled Notifications - Celery instantly queues a task to notify administrators via Email (SMTP/Gmail) when a new submission arrives, guaranteeing low API submission latency.

## Tech Stack


Getting Started
This project is a multi-repo/monorepo candidate (Frontend/Backend) designed to be run concurrently.

Prerequisites
Python 3.10+ and virtual environment (venv)

Node.js 18+ for the Next.js frontend

PostgreSQL (or ability to run Django with SQLite for local testing)

Redis/RabbitMQ (for running Celery)

Backend (Django/DRF) Installation
Clone the repository

Bash

git clone <repository-url>
cd actserv/backend
Set up the Python environment

Bash

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt 
Configure Environment Variables

Bash

cp .env.example .env
# Edit .env: Set DB, EMAIL (SMTP), and Secret Key values.
# Ensure ADMINS_EMAIL_ADDRESS is set for notifications.
Initialize Database and Run Server

Bash

python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver 8001
The API will be available at http://localhost:8001/.

## Documentation
Access the interactive API documentation (Swagger UI) after the server starts:

Swagger UI: http://localhost:8001/api/schema/swagger-ui/

Available Scripts (Django)
python3 manage.py runserver <port> - Start API server

python3 manage.py migrate - Apply database migrations

python3 manage.py shell - Open Django shell

celery -A core worker -l info - Run Celery worker (required for notifications)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built to empower financial services with Creative Dynamic Onboarding. ❤️
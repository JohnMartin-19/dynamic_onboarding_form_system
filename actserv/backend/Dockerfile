# a lightweight official python image to save space ofc
FROM python:3.11-slim

# config environment variables for the application
ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE core.settings

# 2. Set the working directory inside the container
WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt


COPY . /app/


RUN mkdir -p /vol/web/media
RUN mkdir -p /vol/web/static


RUN chmod -R 755 /vol/web

EXPOSE 8000


# CORRECTED: Use the full path and ensure proper argument order for gunicorn
CMD ["/usr/local/bin/gunicorn", "--bind", "0.0.0.0:8000", "core.wsgi:application"]
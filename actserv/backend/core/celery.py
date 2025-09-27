
import os
from celery import Celery

#let celery talk to our settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# celery application instance.

app = Celery('core')


app.config_from_object('django.conf:settings', namespace='CELERY')

#config for auto discovery
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
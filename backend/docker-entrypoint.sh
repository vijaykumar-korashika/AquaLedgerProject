#!/bin/sh
set -e

python manage.py migrate --noinput

if [ "${SEED_DEMO_ON_START}" = "true" ]; then
  python manage.py seed_demo
fi

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${GUNICORN_WORKERS:-2}" \
  --timeout 120

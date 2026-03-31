# syntax=docker/dockerfile:1

FROM python:3.12-slim

WORKDIR /app

COPY scripts/ingest/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scripts/ingest/app.py .
COPY scripts/ingest/ingest_acled.py .

RUN chmod 400 app.py && \
    chmod 400 ingest_acled.py

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5050", "--timeout", "600"]

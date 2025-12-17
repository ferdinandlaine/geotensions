FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends cron \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chmod=400 ingest_acled.py .
COPY --chmod=500 run_ingest.sh .

CMD ["/app/run_ingest.sh"]

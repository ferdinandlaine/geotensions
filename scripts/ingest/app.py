from flask import Flask, request, jsonify
import os
import csv
import functools
import logging
import time

from pathlib import Path

from ingest_acled import process_csv_file, connect_db

logging.Formatter.converter = time.gmtime
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    datefmt="%a %b %d %H:%M:%S UTC %Y",
)
logger = logging.getLogger("ingest_app")

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", 500))
DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))

if not ADMIN_USERNAME or not ADMIN_PASSWORD:
    raise ValueError(
        "ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required"
    )

app = Flask(__name__)
app.json.sort_keys = False
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024


def require_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if (
            not auth
            or auth.username != ADMIN_USERNAME
            or auth.password != ADMIN_PASSWORD
        ):
            return (
                jsonify({"error": "Unauthorized"}),
                401,
                {"WWW-Authenticate": "Basic"},
            )
        return f(*args, **kwargs)

    return decorated


@app.route("/", methods=["POST"])
@require_auth
def upload():
    file = request.files.get("file")

    if not file or not file.filename:
        return jsonify({"error": "No file provided"}), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({"error": "File must be a CSV"}), 400

    filepath = DATA_DIR / file.filename
    file.save(str(filepath))

    with open(filepath, "r", newline="", encoding="utf-8-sig") as f:
        headers = next(csv.reader(f), None)

    if headers is None:
        filepath.unlink()
        return jsonify({"error": "CSV file is empty"}), 400

    required_columns = {"event_id_cnty", "event_date", "latitude", "longitude"}
    if not required_columns.issubset(set(headers)):
        filepath.unlink()
        return (
            jsonify(
                {"error": f"CSV missing required columns: {sorted(required_columns)}"}
            ),
            400,
        )

    try:
        conn = connect_db()
        try:
            upserted, skipped = process_csv_file(filepath, conn)
        finally:
            conn.close()
    except Exception as e:
        logger.error(f"Error processing {file.filename}: {e}")
        return jsonify({"error": "Failed to process file"}), 500

    filepath.unlink()
    logger.info(f"Processed {file.filename}: {upserted} upserted, {skipped} skipped")
    return (
        jsonify(
            {
                "success": True,
                "file": file.filename,
                "upserted": upserted,
                "skipped": skipped,
            }
        ),
        201,
    )


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not Found"}), 404

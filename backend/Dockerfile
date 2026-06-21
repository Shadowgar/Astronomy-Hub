FROM python:3.12-slim

WORKDIR /app

# Preserve current package layout and the repo-level skydata helpers used at runtime.
COPY backend ./backend
COPY scripts ./scripts

# Install runtime dependencies from requirements.txt
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install --no-cache-dir -r /app/backend/requirements.txt

RUN groupadd --system appuser && \
    useradd --system --gid appuser --create-home appuser && \
    chown -R appuser:appuser /app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

USER appuser

CMD ["python3", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]

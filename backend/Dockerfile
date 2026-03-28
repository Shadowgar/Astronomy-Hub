FROM python:3.12-slim

WORKDIR /app

# Preserve current package layout inside the container.
COPY . ./backend/

# Install runtime dependencies from requirements.txt
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install --no-cache-dir -r /app/backend/requirements.txt

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python3", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
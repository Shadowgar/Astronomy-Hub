FROM python:3.12-slim

WORKDIR /app

# Copy only backend sources; image runs the existing backend script as-is
COPY backend/ ./backend/

ENV PYTHONUNBUFFERED=1

# Expose default port used by the backend (server.py reads PORT env var)
EXPOSE 8000

CMD ["python3", "backend/server.py"]

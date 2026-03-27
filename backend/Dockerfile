FROM python:3.12-slim

WORKDIR /app

# Copy only backend sources; Compose builds from ./backend so the context root
# already contains the backend files. Place them under /app/backend to preserve
# the current runtime path `backend/server.py` used by the repository.
COPY . ./backend/

# Install runtime dependencies from requirements.txt
RUN python3 -m pip install --upgrade pip && \
	python3 -m pip install --no-cache-dir -r /app/backend/requirements.txt

ENV PYTHONUNBUFFERED=1

# Expose default port used by the backend (server.py reads PORT env var)
EXPOSE 8000

CMD ["python3", "backend/server.py"]

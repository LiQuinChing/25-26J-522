FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Assuming it runs on 8002; adjust if your main.py specifies a different port
EXPOSE 8001
CMD ["python", "main.py"]
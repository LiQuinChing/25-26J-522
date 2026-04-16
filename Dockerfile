FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Ports depend on what app.py and api_svt_predict.py are configured to use
EXPOSE 8002 8003
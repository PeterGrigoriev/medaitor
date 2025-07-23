# Technology Stack Options for Mediator

## Backend Language Comparison

### Python
**Pros:**
- Excellent AI/ML ecosystem (transformers, torch, numpy)
- Native Whisper integration via openai-whisper package
- FastAPI for high-performance async web services
- Strong WebSocket support with websockets/socket.io
- Rapid prototyping and development
- Extensive audio processing libraries (librosa, soundfile)

**Cons:**
- GIL can limit true parallelism
- Higher memory usage
- Deployment size can be large with ML dependencies

**Key Libraries:**
- FastAPI/Django for web framework
- openai-whisper for transcription
- websockets for real-time communication
- celery for background tasks

### Golang
**Pros:**
- Excellent concurrency model (goroutines)
- Low latency and high performance
- Small binary size
- Strong WebSocket support in stdlib
- Great for microservices architecture
- Low memory footprint

**Cons:**
- Limited ML/AI libraries
- Would need to call Whisper via subprocess or API
- Less mature audio processing ecosystem
- Steeper learning curve for ML integration

**Key Libraries:**
- Gin/Echo for web framework
- gorilla/websocket for WebSocket
- go-audio for audio processing
- Must wrap Whisper via CGO or subprocess

### Kotlin
**Pros:**
- JVM ecosystem with excellent performance
- Coroutines for async programming
- Can leverage Java audio libraries
- Ktor for modern web development
- Good for Android client if needed later
- Type safety and null safety

**Cons:**
- JVM memory overhead
- Limited native ML support
- Would need JNI/JNA for Whisper integration
- Smaller community for web services

**Key Libraries:**
- Ktor for web framework
- kotlinx.coroutines for async
- Java Sound API for audio
- DeepSpeech Java bindings (alternative to Whisper)

## Speech Recognition Options

### OpenAI Whisper (Local)
**Pros:**
- State-of-the-art accuracy
- Runs completely offline
- Multiple model sizes (tiny to large)
- Speaker diarization with whisperX
- Free and open source
- Supports 99+ languages

**Cons:**
- Resource intensive for real-time
- Requires GPU for best performance
- Latency can be high for large models

**Setup:**
```python
# Python native
pip install openai-whisper whisperx

# Docker support available
FROM python:3.11
RUN pip install openai-whisper
```

### Faster Whisper
**Pros:**
- 4x faster than OpenAI Whisper
- Lower memory usage
- ONNX/CTranslate2 optimized
- Same accuracy as original
- Better for real-time applications

**Cons:**
- Still requires significant CPU/GPU
- Setup slightly more complex

**Setup:**
```python
pip install faster-whisper
```

### wav2vec2 (Facebook/Meta)
**Pros:**
- Designed for streaming ASR
- Lower latency than Whisper
- Good accuracy
- Lighter weight models available

**Cons:**
- Not as accurate as Whisper
- Less language support
- Requires more fine-tuning

### SpeechRecognition Libraries
**Pros:**
- Simple API
- Multiple backend support
- Good for prototyping

**Cons:**
- Not suitable for production
- Limited real-time support
- Accuracy varies by backend

### Cloud Alternatives (Hybrid Approach)
- **Amazon Transcribe Streaming**: Low latency, speaker diarization, pay-per-use
- **Google Cloud Speech-to-Text**: Excellent accuracy, streaming support
- **Azure Speech Services**: Good accuracy, real-time support
- **Deepgram**: Specialized for real-time, very low latency

## Local Development Stack with Docker Compose

### Recommended Architecture

```yaml
version: '3.8'

services:
  # API Backend
  api:
    build: ./backend
    environment:
      - WHISPER_MODEL=base
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./models:/models
      - ./rules:/rules
    depends_on:
      - redis
      - whisper
    ports:
      - "8000:8000"

  # Whisper Service (Dedicated)
  whisper:
    build: ./whisper-service
    volumes:
      - ./models:/models
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          devices:
            - capabilities: [gpu]  # Optional GPU support

  # WebRTC Signaling Server
  signaling:
    build: ./signaling
    ports:
      - "8080:8080"
    environment:
      - REDIS_URL=redis://redis:6379

  # Redis for Pub/Sub and Caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # Frontend Dev Server
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

  # Local TURN Server for WebRTC
  coturn:
    image: coturn/coturn
    ports:
      - "3478:3478"
      - "3478:3478/udp"
    environment:
      - DETECT_RELAY_IP=1
```

### Technology Recommendations by Component

#### For Transcription Service
**Recommendation: Python + Faster Whisper**
- Best ML ecosystem
- Native Whisper support
- Can optimize with faster-whisper
- Easy integration with audio processing

```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y ffmpeg
RUN pip install faster-whisper fastapi uvicorn
```

#### For API/WebSocket Server
**Recommendation: Python (FastAPI) or Go**

**Python Option:**
- Use if prioritizing ML integration
- FastAPI for REST + WebSocket
- Good for rapid development

**Go Option:**
- Use if prioritizing performance
- Excellent for WebSocket handling
- Better for high concurrency

#### For Real-time Processing
**Recommendation: Go microservice**
- Handle WebRTC signaling
- Route audio streams
- Minimal latency

### Development Workflow

1. **Local Only Mode**
   ```bash
   docker-compose up
   # Everything runs locally
   # Whisper processes audio on your machine
   ```

2. **Hybrid Mode**
   ```bash
   docker-compose up api frontend redis
   # Use cloud transcription for development
   # Faster iteration, no GPU needed
   ```

3. **Production Mode**
   - Deploy whisper service to GPU instances
   - Scale API servers horizontally
   - Use managed Redis/ElastiCache

## Final Recommendations

### For MVP Development
1. **Language**: Python with FastAPI
2. **Transcription**: Faster-whisper (local) with fallback to cloud
3. **Local Dev**: Docker Compose with all services
4. **WebRTC**: Simple WebSocket signaling in Python
5. **Frontend**: React with WebRTC direct p2p

### Architecture Pattern
```
Frontend <-> WebSocket <-> API Server <-> Whisper Service
                              |
                            Redis
                              |
                         Git Rules Repo
```

### Migration Path
1. Start with Python monolith
2. Extract Whisper to dedicated service
3. Add Go signaling server if needed
4. Scale components independently

This approach allows you to:
- Run everything locally for development
- Use same stack in production
- Gradually optimize bottlenecks
- Switch transcription providers easily
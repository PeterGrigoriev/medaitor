# Deepgram Integration Guide

## Overview

This guide walks through integrating Deepgram's real-time speech-to-text API into Mediator for live conversation transcription.

## Why Deepgram?

- **Ultra-low latency**: 300-500ms for real-time transcription
- **Speaker diarization**: Built-in "who said what" detection
- **WebSocket streaming**: Perfect match for our architecture
- **Cost-effective**: $0.0043/minute ($2.58 for 10 people × 1 hour)
- **High accuracy**: 95%+ for conversational speech

## Step 1: Create Deepgram Account

### Sign Up
1. Go to [deepgram.com](https://deepgram.com)
2. Click **"Start Building for Free"**
3. Sign up with email or GitHub account
4. Verify your email address

### Free Credits
- New accounts get **$200 in free credits**
- No credit card required initially
- Enough for ~77 hours of single-person transcription testing
- Credits expire after 90 days

## Step 2: Create API Key

### Console Access
1. Log into [console.deepgram.com](https://console.deepgram.com)
2. Navigate to **"API Keys"** in the left sidebar
3. Click **"Create a New API Key"**

### API Key Configuration
- **Name**: `medaitor-production` (or `medaitor-dev` for testing)
- **Scopes**: Select `usage:read` and `usage:write`
- **Expiration**: Set to "Never" for production, or 90 days for testing
- Click **"Create Key"**

### Store API Key Securely
```bash
# Add to your .env file (DO NOT commit to git)
DEEPGRAM_API_KEY=your_api_key_here

# For production deployment
export DEEPGRAM_API_KEY=your_api_key_here
```

## Step 3: Install Deepgram SDK

### Update pyproject.toml
```toml
[project]
dependencies = [
    # ... existing dependencies
    "deepgram-sdk>=3.4.0",
    "python-multipart>=0.0.9",
]
```

### Install Dependencies
```bash
# Using uv (our standard)
uv pip install deepgram-sdk

# Or install all dependencies
uv pip install -e .
```

## Step 4: Integration Architecture

### Service Structure
```
src/medaitor/services/
├── transcription.py      # Existing (fallback to local)
└── deepgram_service.py   # New Deepgram integration
```

### Configuration Updates
```python
# src/medaitor/config.py
class Settings(BaseSettings):
    # ... existing settings
    
    # Deepgram configuration
    deepgram_api_key: str = ""
    deepgram_model: str = "nova-2"  # Latest model
    use_deepgram: bool = True
    
    # Transcription settings
    enable_speaker_detection: bool = True
    language: str = "en-US"
```

## Step 5: Deepgram Service Implementation

### Create Deepgram Service
```python
# src/medaitor/services/deepgram_service.py
import asyncio
import json
import logging
from typing import AsyncGenerator, Optional

from deepgram import DeepgramClient, DeepgramClientOptions, LiveTranscriptionEvents
from deepgram.clients.live.v1 import LiveOptions

from medaitor.config import settings

logger = logging.getLogger(__name__)


class DeepgramTranscriptionService:
    """Real-time transcription service using Deepgram API."""
    
    def __init__(self):
        self.client = None
        self.connection = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Deepgram client."""
        if not settings.deepgram_api_key:
            logger.warning("Deepgram API key not provided")
            return
            
        config = DeepgramClientOptions(
            api_key=settings.deepgram_api_key,
            verbose=settings.debug
        )
        self.client = DeepgramClient("", config)
    
    async def start_transcription(self, room_id: str) -> Optional[object]:
        """Start real-time transcription for a room."""
        if not self.client:
            logger.error("Deepgram client not initialized")
            return None
        
        try:
            # Configure transcription options
            options = LiveOptions(
                model=settings.deepgram_model,
                language=settings.language, 
                smart_format=True,
                encoding="linear16",
                channels=1,
                sample_rate=16000,
                # Speaker diarization
                diarize=settings.enable_speaker_detection,
                punctuate=True,
                # Real-time optimization
                interim_results=True,
                utterance_end_ms="1000",
                vad_events=True,
            )
            
            # Create connection
            connection = self.client.listen.asyncwebsocket.v("1")
            
            # Set up event handlers
            connection.on(LiveTranscriptionEvents.Open, self._on_open)
            connection.on(LiveTranscriptionEvents.Transcript, 
                         lambda data: self._on_transcript(data, room_id))
            connection.on(LiveTranscriptionEvents.Error, self._on_error)
            connection.on(LiveTranscriptionEvents.Close, self._on_close)
            
            # Start connection
            await connection.start(options)
            
            self.connection = connection
            return connection
            
        except Exception as e:
            logger.error(f"Failed to start Deepgram transcription: {e}")
            return None
    
    async def send_audio(self, audio_data: bytes):
        """Send audio data to Deepgram for transcription."""
        if self.connection:
            await self.connection.send(audio_data)
    
    async def stop_transcription(self):
        """Stop the transcription connection."""
        if self.connection:
            await self.connection.finish()
            self.connection = None
    
    def _on_open(self, data):
        """Handle connection open."""
        logger.info("Deepgram connection opened")
    
    def _on_transcript(self, data, room_id: str):
        """Handle transcription results."""
        try:
            transcript_data = json.loads(data)
            
            # Extract transcript information
            transcript = transcript_data.get("channel", {}).get("alternatives", [{}])[0]
            text = transcript.get("transcript", "")
            confidence = transcript.get("confidence", 0.0)
            
            # Speaker information (if available)
            words = transcript.get("words", [])
            speaker = "Unknown"
            if words and settings.enable_speaker_detection:
                speaker = f"Speaker {words[0].get('speaker', 0) + 1}"
            
            # Only process if we have actual text
            if text.strip() and confidence > 0.7:
                # Send to WebSocket manager
                asyncio.create_task(self._broadcast_transcript({
                    "type": "transcript",
                    "room_id": room_id,
                    "speaker": speaker,
                    "text": text,
                    "confidence": confidence,
                    "is_final": not transcript_data.get("is_final", True),
                    "timestamp": transcript_data.get("start", 0.0)
                }))
                
        except Exception as e:
            logger.error(f"Error processing transcript: {e}")
    
    async def _broadcast_transcript(self, transcript_data: dict):
        """Broadcast transcript to WebSocket connections."""
        # Import here to avoid circular imports
        from medaitor.api.websocket import manager
        
        await manager.broadcast(
            transcript_data,
            transcript_data["room_id"]
        )
    
    def _on_error(self, data):
        """Handle connection errors."""
        logger.error(f"Deepgram error: {data}")
    
    def _on_close(self, data):
        """Handle connection close."""
        logger.info("Deepgram connection closed")
        self.connection = None


# Global service instance
deepgram_service = DeepgramTranscriptionService()
```

## Step 6: Update WebSocket Handler

### Modify WebSocket Endpoint
```python
# src/medaitor/api/websocket.py
import base64
import json
from medaitor.services.deepgram_service import deepgram_service

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket, room_id)
    
    # Start Deepgram transcription for this room
    transcription_connection = await deepgram_service.start_transcription(room_id)
    
    try:
        await websocket.send_json({
            "type": "system",
            "message": f"Connected to room {room_id}",
            "transcription_enabled": transcription_connection is not None
        })
        
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "audio":
                # Handle incoming audio data
                audio_data = base64.b64decode(data.get("audio", ""))
                await deepgram_service.send_audio(audio_data)
                
            elif data.get("type") == "offer":
                await manager.broadcast(data, room_id, exclude=websocket)
                
            # ... handle other message types
            
    except WebSocketDisconnect:
        await deepgram_service.stop_transcription()
        manager.disconnect(websocket, room_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await deepgram_service.stop_transcription()
        manager.disconnect(websocket, room_id)
```

## Step 7: Frontend Audio Capture

### Update JavaScript (base.html)
```javascript
// Add to base.html
let mediaRecorder = null;
let audioChunks = [];

async function startAudioCapture() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            } 
        });
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                // Convert to base64 and send to WebSocket
                const reader = new FileReader();
                reader.onload = () => {
                    const audioData = reader.result.split(',')[1]; // Remove data URL prefix
                    ws.send(JSON.stringify({
                        type: 'audio',
                        audio: audioData
                    }));
                };
                reader.readAsDataURL(event.data);
            }
        };
        
        // Send audio chunks every 250ms for real-time transcription
        mediaRecorder.start(250);
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

function stopAudioCapture() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
}
```

## Step 8: Environment Configuration

### Development (.env)
```bash
# Deepgram Configuration
DEEPGRAM_API_KEY=your_development_api_key_here
USE_DEEPGRAM=true
DEEPGRAM_MODEL=nova-2
ENABLE_SPEAKER_DETECTION=true
LANGUAGE=en-US

# App Configuration
LOG_LEVEL=debug
```

### Production (App Runner)
```bash
# Set environment variables in AWS App Runner console
DEEPGRAM_API_KEY=your_production_api_key_here
USE_DEEPGRAM=true
DEEPGRAM_MODEL=nova-2
ENABLE_SPEAKER_DETECTION=true
```

## Step 9: Testing

### Local Testing
```bash
# Start the application
./run-app.sh

# Open browser to http://localhost:8000
# Click "Create Room" and test microphone access
# Speak and verify transcriptions appear in real-time
```

### Test Audio Quality
1. **Clear speech**: Verify high accuracy transcription
2. **Multiple speakers**: Test speaker diarization
3. **Background noise**: Test noise suppression
4. **Network issues**: Test reconnection handling

## Step 10: Monitoring & Usage

### Usage Tracking
- Monitor usage in [Deepgram Console](https://console.deepgram.com)
- Set up billing alerts for cost control
- Track API response times and error rates

### Key Metrics to Watch
- **Transcription accuracy**: >95% for clear speech
- **Latency**: <500ms end-to-end
- **Error rate**: <1% API failures
- **Cost per session**: ~$2.58 for 10 people × 1 hour

### Troubleshooting
- **High latency**: Check network connection, reduce audio chunk size
- **Poor accuracy**: Verify audio quality, adjust noise suppression
- **API errors**: Check API key, billing status, rate limits

## Pricing & Limits

### Free Tier
- **$200 in credits** for new accounts
- **~46 hours** of transcription (10 concurrent users)
- **90-day expiration** on credits

### Production Pricing
- **Pay-as-you-go**: $0.0043 per minute
- **Volume discounts**: Available for >1M minutes/month
- **No rate limits** for standard usage

### Cost Examples
- **10 people, 1 hour**: $2.58
- **Daily 1-hour sessions**: ~$77/month
- **Weekly 1-hour sessions**: ~$10/month

## Security Best Practices

### API Key Management
- **Never commit** API keys to version control
- **Use environment variables** for all deployments
- **Rotate keys regularly** (every 90 days)
- **Use separate keys** for dev/staging/production

### Audio Data
- **Audio is not stored** by Deepgram (real-time only)
- **GDPR compliant** processing
- **End-to-end encryption** for WebSocket connections

## Next Steps

1. **Implement the service** following the code examples above
2. **Test locally** with microphone input
3. **Deploy to App Runner** with environment variables
4. **Monitor usage** and optimize for your specific use case
5. **Add error handling** and fallback to local Whisper if needed

## Support Resources

- **Documentation**: [developers.deepgram.com](https://developers.deepgram.com)
- **Community**: [Discord](https://discord.gg/xWRaCDBtW4)
- **Support**: support@deepgram.com
- **Status Page**: [status.deepgram.com](https://status.deepgram.com)
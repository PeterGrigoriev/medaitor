"""Transcription service using Whisper."""

import logging
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Handles audio transcription using Whisper."""
    
    def __init__(self, model_name: str = "base", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load Whisper model."""
        try:
            from faster_whisper import WhisperModel
            
            logger.info(f"Loading Whisper model: {self.model_name}")
            self.model = WhisperModel(
                self.model_name,
                device=self.device,
                compute_type="int8" if self.device == "cpu" else "float16",
            )
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            # Fallback to mock transcription for development
            self.model = None
    
    async def transcribe_audio(
        self,
        audio_data: np.ndarray,
        sample_rate: int = 16000,
    ) -> dict:
        """Transcribe audio data."""
        if self.model is None:
            # Mock transcription for development
            return {
                "text": "Mock transcription result",
                "segments": [
                    {
                        "start": 0.0,
                        "end": 1.0,
                        "text": "Mock transcription result",
                    }
                ],
            }
        
        try:
            segments, info = self.model.transcribe(
                audio_data,
                beam_size=5,
                vad_filter=True,
            )
            
            result = {
                "text": "",
                "segments": [],
                "language": info.language,
                "duration": info.duration,
            }
            
            for segment in segments:
                result["segments"].append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip(),
                })
                result["text"] += segment.text + " "
            
            result["text"] = result["text"].strip()
            return result
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise
    
    async def transcribe_file(self, audio_path: Path) -> dict:
        """Transcribe audio file."""
        if self.model is None:
            return await self.transcribe_audio(np.array([]))
        
        try:
            segments, info = self.model.transcribe(str(audio_path))
            
            result = {
                "text": "",
                "segments": [],
                "language": info.language,
                "duration": info.duration,
            }
            
            for segment in segments:
                result["segments"].append({
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip(),
                })
                result["text"] += segment.text + " "
            
            result["text"] = result["text"].strip()
            return result
            
        except Exception as e:
            logger.error(f"File transcription error: {e}")
            raise
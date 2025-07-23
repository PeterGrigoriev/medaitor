# Mediator - AI-Assisted Conversation Moderator/Mediator

## System Overview

Mediator is an AI-powered system designed to moderate and mediate spoken conversations between two or more participants. The system monitors real-time voice conversations, transcribes speech, and enforces community guidelines to ensure productive and respectful discourse.

## Core Features

### Version 1.0 (MVP)

1. **Real-time Voice Chat Room**
   - Support for 2+ simultaneous speakers
   - WebRTC-based voice communication
   - Browser-based client (no downloads required)
   - Room creation and joining functionality

2. **Speech Transcription**
   - Real-time speech-to-text conversion
   - Speaker identification and labeling
   - Timestamped transcript generation
   - Display of "who said what" in chat interface

3. **Community Rules Management**
   - Rules stored as Markdown files in Git repository
   - Version-controlled rule updates
   - Hot-reloading of rules without service restart
   - Support for multiple rule sets per community

## Technical Architecture

### AWS Services

1. **Compute**
   - EC2 or ECS for application hosting
   - Lambda for serverless rule processing

2. **Real-time Communication**
   - API Gateway WebSocket for signaling
   - Kinesis Video Streams for media relay (optional)
   
3. **Transcription**
   - Amazon Transcribe for speech-to-text
   - Real-time streaming transcription
   - Multi-speaker diarization

4. **Storage**
   - S3 for transcript archives
   - DynamoDB for session metadata
   - CodeCommit or GitHub integration for rules repository

5. **Infrastructure**
   - CloudFormation or CDK for IaC
   - Route 53 for DNS
   - CloudFront for content delivery

### Application Components

1. **Frontend**
   - React or Vue.js web application
   - WebRTC client implementation
   - Real-time transcript display
   - Room management interface

2. **Backend**
   - Node.js or Python API server
   - WebSocket handler for real-time events
   - Git integration for rules management
   - Session and user management

3. **AI/ML Pipeline**
   - Audio stream processing
   - Transcription service integration
   - Future: Moderation AI integration

## Data Flow

1. Users join a voice chat room through web interface
2. Audio streams are captured via WebRTC
3. Audio is sent to Amazon Transcribe for real-time transcription
4. Transcribed text with speaker labels is broadcast to all participants
5. Transcripts are stored for session history

## Security Requirements

- End-to-end encryption for voice data
- Secure WebSocket connections (WSS)
- Authentication and authorization for room access
- GDPR-compliant data handling
- Automatic transcript deletion policies

## Scalability Considerations

- Support for multiple concurrent rooms
- Horizontal scaling of transcription workers
- CDN distribution for global access
- Auto-scaling based on active sessions

## Future Enhancements (Post-MVP)

1. **AI Moderation Features**
   - Real-time content analysis
   - Automatic intervention for rule violations
   - Sentiment analysis and tension detection
   - Conversation quality metrics

2. **Advanced Features**
   - Video support
   - Screen sharing
   - Conversation recordings
   - Multi-language support
   - Mobile applications

3. **Analytics Dashboard**
   - Conversation metrics
   - Rule violation statistics
   - User engagement analytics
   - Moderation effectiveness reports

## Development Phases

### Phase 1: Infrastructure Setup
- AWS account and service configuration
- Basic WebRTC implementation
- Git repository for rules

### Phase 2: Core Functionality
- Voice chat room implementation
- Amazon Transcribe integration
- Basic web interface

### Phase 3: Rules Integration
- Git-based rules management
- Rule parsing and loading
- Admin interface for rule updates

### Phase 4: Production Readiness
- Security hardening
- Performance optimization
- Monitoring and logging
- Documentation

## Success Metrics

- Transcription accuracy > 95%
- Latency < 2 seconds for transcription
- Support for 10+ concurrent speakers per room
- 99.9% uptime for voice service
- Sub-second rule update propagation
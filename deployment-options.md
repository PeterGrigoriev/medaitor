# Deployment Options for Mediator

## Overview

This document outlines deployment strategies for the Mediator AI-assisted conversation moderator, optimized for **≤10 concurrent users** initially with clear scaling paths.

## Current Requirements

- **Users**: Maximum 10 concurrent connections
- **Traffic**: Low volume, sporadic usage
- **Budget**: Cost-effective solution preferred
- **Reliability**: High uptime desired but not mission-critical
- **Geographic**: Single region deployment initially

## Deployment Options

### 1. AWS Deployment (Recommended)

#### Option 1A: AWS Lightsail (Ultra Low Cost)
**Best for**: Proof of concept, minimal budget

```yaml
Resources:
  - Lightsail instance: $10-20/month
  - Storage: 40GB SSD included
  - Data transfer: 2TB included
  - Redis: ElastiCache Serverless (~$5/month)
```

**Specifications:**
- Instance: 2 vCPU, 4GB RAM ($20/month)
- OS: Ubuntu 22.04 LTS
- Docker deployment via docker-compose
- Automatic backups included

**Pros:**
- Fixed monthly cost (~$25/month total)
- Simple management interface
- Includes load balancer option
- Easy scaling path to EC2

**Cons:**
- Limited to single AZ
- Basic monitoring
- No auto-scaling

#### Option 1B: AWS EC2 + ECS (Scalable)
**Best for**: Production ready, growth expected

```yaml
Resources:
  - EC2 t3.small: ~$15/month
  - Application Load Balancer: ~$20/month
  - ElastiCache (t3.micro): ~$12/month
  - ECS Fargate: Pay per use (~$10/month for low usage)
  - S3 storage: ~$5/month
```

**Specifications:**
- EC2: t3.small (2 vCPU, 2GB RAM)
- ECS Fargate for containerized deployment
- Redis via ElastiCache
- ALB for load balancing and SSL termination

**Pros:**
- Auto-scaling capabilities
- High availability options
- Managed services
- Professional monitoring with CloudWatch

**Cons:**
- More complex setup
- Higher cost (~$60/month)
- Requires AWS expertise

#### Option 1C: AWS App Runner (Serverless)
**Best for**: Minimal operations, pay-per-use

```yaml
Resources:
  - App Runner service: ~$25/month (0.25 vCPU, 0.5GB)
  - ElastiCache Serverless: ~$8/month
  - S3 storage: ~$2/month
```

**Pros:**
- Zero infrastructure management
- Automatic scaling (including to zero)
- Built-in CI/CD from GitHub
- Pay only for actual usage

**Cons:**
- Limited customization
- Cold start latency
- Newer service with fewer features

### 2. Alternative Cloud Providers

#### Option 2A: DigitalOcean Droplet
**Best for**: Simple VPS deployment

```yaml
Resources:
  - Droplet (2GB RAM): $18/month
  - Managed Redis: $15/month
  - Load Balancer: $12/month (optional)
  - Spaces (storage): $5/month
```

**Total**: ~$35/month
**Pros**: Simple interface, good documentation, predictable pricing
**Cons**: Limited geographic regions, basic managed services

#### Option 2B: Railway.app
**Best for**: Developer-friendly deployment

```yaml
Resources:
  - Web service: ~$20/month
  - Redis addon: ~$10/month
  - Storage: ~$5/month
```

**Total**: ~$35/month
**Pros**: Git-based deployments, simple interface, good for startups
**Cons**: Newer platform, limited enterprise features

#### Option 2C: Google Cloud Run
**Best for**: Serverless, pay-per-request

```yaml
Resources:
  - Cloud Run: ~$15/month (2M requests)
  - Cloud Memorystore (Redis): ~$25/month
  - Cloud Storage: ~$3/month
```

**Total**: ~$45/month
**Pros**: True serverless, scales to zero, Google infrastructure
**Cons**: Complex networking for WebSockets, cold starts

### 3. Local/On-Premises Options

#### Option 3A: Home Server/Raspberry Pi
**Best for**: Development, private use

```yaml
Hardware:
  - Raspberry Pi 4 (8GB): $75 one-time
  - SSD storage: $50 one-time
  - Network: Existing internet connection
```

**Ongoing**: ~$10/month (electricity + domain)
**Pros**: Full control, very low cost, educational
**Cons**: No redundancy, home internet limitations, security concerns

#### Option 3B: Dedicated Server (Hetzner)
**Best for**: Performance per dollar

```yaml
Resources:
  - Dedicated server: €35/month (~$38)
  - Specs: AMD Ryzen 5, 64GB RAM, 2x512GB NVMe
```

**Pros**: Excellent performance, fixed cost, root access
**Cons**: No managed services, requires server administration

## Recommended Architecture by Option

### AWS Lightsail Deployment
```yaml
Services:
  - Lightsail instance with Docker Compose
  - ElastiCache Redis (managed)
  - Lightsail load balancer (SSL termination)
  - Route53 for DNS
  - CloudWatch for basic monitoring

Docker Compose:
  - Mediator app container
  - Nginx reverse proxy
  - Automated SSL with Let's Encrypt
```

### DigitalOcean Deployment
```yaml
Services:
  - Droplet with Docker
  - Managed Redis
  - DigitalOcean Load Balancer
  - Spaces for file storage
  - App Platform for CI/CD (optional)

Setup:
  - Ubuntu 22.04 LTS
  - Docker + docker-compose
  - Nginx for SSL termination
  - Automated backups
```

## Cost Comparison (Monthly)

| Option | Cost | Effort | Scalability | Reliability |
|--------|------|--------|-------------|-------------|
| AWS Lightsail | $25 | Low | Medium | High |
| AWS EC2/ECS | $60 | High | High | Very High |
| AWS App Runner | $35 | Very Low | High | High |
| DigitalOcean | $35 | Low | Medium | High |
| Railway.app | $35 | Very Low | Medium | Medium |
| Google Cloud Run | $45 | Medium | High | High |
| Raspberry Pi | $10 | Medium | Low | Low |
| Hetzner Dedicated | $38 | High | Low | Medium |

## Scaling Path

### Phase 1: 1-10 Users
- **Recommended**: AWS Lightsail or DigitalOcean Droplet
- Single instance deployment
- Basic monitoring
- Manual backups

### Phase 2: 10-50 Users
- Upgrade to AWS EC2 t3.medium
- Add Application Load Balancer
- Managed Redis (ElastiCache)
- CloudWatch monitoring
- Automated backups

### Phase 3: 50-200 Users
- Auto Scaling Groups
- Multi-AZ deployment
- RDS for persistent data
- CloudFront CDN
- Professional monitoring

### Phase 4: 200+ Users
- ECS/EKS container orchestration
- Multi-region deployment
- Microservices architecture
- Advanced observability

## Security Considerations

### All Deployments
- SSL/TLS encryption (Let's Encrypt or managed certificates)
- Regular security updates
- Firewall configuration (allow only necessary ports)
- Strong authentication for admin access

### Cloud Deployments
- IAM roles and policies
- Security groups/firewall rules
- VPC configuration
- Regular vulnerability scanning

## Monitoring & Observability

### Basic (All Options)
- Application logs
- System metrics (CPU, memory, disk)
- Uptime monitoring
- Basic alerting

### Advanced (Production)
- APM (Application Performance Monitoring)
- Distributed tracing
- Custom business metrics
- Log aggregation and analysis

## Backup Strategy

### Development/Testing
- Weekly database exports
- Configuration backups
- Git repository backups

### Production
- Daily automated backups
- Cross-region backup replication
- Point-in-time recovery
- Backup restoration testing

## Final Recommendations

### For MVP/Testing (≤10 users)
**Top Choice**: **AWS Lightsail** ($25/month)
- Easiest to set up and manage
- Predictable costs
- Good performance for small scale
- Clear path to AWS ecosystem

**Alternative**: **DigitalOcean Droplet** ($35/month)
- Great developer experience
- Excellent documentation
- Slightly more expensive but very reliable

### For Production Ready (≤10 users)
**Top Choice**: **AWS App Runner** ($35/month)
- Minimal operations overhead
- Built-in scaling and monitoring
- Professional deployment option
- Good balance of cost and features

### Development/Personal Use
**Top Choice**: **Railway.app** ($35/month)
- Git-based deployments
- Very developer-friendly
- Good for rapid iterations
- Built-in CI/CD

## Getting Started

1. **Week 1**: Deploy MVP on AWS Lightsail
2. **Week 2**: Set up monitoring and backups
3. **Week 3**: Configure custom domain and SSL
4. **Week 4**: Performance testing and optimization

Choose the option that best fits your technical expertise, budget, and growth expectations.
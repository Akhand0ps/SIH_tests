# Mental Health Tests API Server

A comprehensive backend system for mental health assessments with multilingual support (English & Kashmiri), advanced scoring algorithms, and personalized recommendations.

## 🚀 Features

### Core Functionality
- **Multiple Assessment Tools**: PHQ-9, GAD-7, GHQ-12, PSS-10, K-10, WHO-5, BRS, UCLA Loneliness Scale, ISI, MBI-SS, AUDIT, 16 Personality MBTI
- **Multilingual Support**: English and Kashmiri languages
- **Advanced Scoring**: Handles reverse scoring, MBTI trait calculation, percentile calculations
- **Privacy-First**: Anonymous user IDs, no personally identifiable information stored
- **Real-time Results**: Immediate scoring and interpretation

### Intelligent Recommendations
- **Personalized Suggestions**: Based on test scores and personality type
- **Category-Based**: Meditation, counseling, lifestyle, exercise, social, medical recommendations
- **Priority-Based**: Urgent, high, medium, low priority recommendations
- **Evidence-Based**: Clinically validated recommendation strategies

### Privacy & Security
- **Anonymous User Tracking**: Secure anonymous IDs for session management
- **Data Protection**: IP and device hashing, no PII storage
- **CORS Configuration**: Secure frontend communication
- **Data Retention**: Automatic cleanup of old data (1 years)

## 📊 Supported Assessment Tools

| Test | Full Name | Purpose | Questions | Languages |
|------|-----------|---------|-----------|-----------|
| PHQ-9 | Patient Health Questionnaire | Depression screening | 9 | EN, KS |
| GAD-7 | Generalized Anxiety Disorder Scale | Anxiety screening | 7 | EN, KS |
| GHQ-12 | General Health Questionnaire | Mental health screening | 12 | EN, KS |
| PSS-10 | Perceived Stress Scale | Stress measurement | 10 | EN, KS |
| K-10 | Kessler Psychological Distress Scale | Psychological distress | 10 | EN, KS |
| WHO-5 | WHO Well-Being Index | Well-being assessment | 5 | EN, KS |
| BRS | Brief Resilience Scale | Resilience measurement | 6 | EN, KS |
| UCLA | UCLA Loneliness Scale | Loneliness assessment | 8 | EN, KS |
| ISI | Insomnia Severity Index | Sleep disorder screening | 7 | EN, KS |
| MBI-SS | Maslach Burnout Inventory - Student | Academic burnout | 7 | EN, KS |
| AUDIT | Alcohol Use Disorders Identification | Alcohol screening | 10 | EN, KS |
| 16PER/MBTI | 16 Personality Type Indicator | Personality assessment | 8+ | EN, KS |

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd p_tests
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if local)
   mongod
   
   # The application will auto-create collections and indexes
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mental_health_tests

# Server
NODE_ENV=development
PORT=3000

# CORS Origins
FRONTEND_URL_1=http://localhost:3001
FRONTEND_URL_2=http://127.0.0.1:3001

# Security
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=15

# Data Retention (days)
DATA_RETENTION_DAYS=365
```

## 📡 API Endpoints

### Questions Endpoints
```http
GET /api/v1/questions/:testName
GET /api/v1/questions/phq9
GET /api/v1/questions/gad7
GET /api/v1/questions/mbti
```

### Answer Submission
```http
POST /api/v1/answers/:testName
POST /api/v1/answers/batch
POST /api/v1/answers/:testName/validate
```

### User Data (Anonymous)
```http
GET /api/v1/answers/user/:userId
GET /api/v1/answers/recommendations/:userId
PUT /api/v1/answers/recommendations/:recommendationId/read
```

### System Endpoints
```http
GET /api/health
GET /api/docs
GET /api/v1/answers/tests
```

## 💡 Usage Examples

### Submit Test Answers
```javascript
POST /api/v1/answers/phq9
Content-Type: application/json

{
  "answers": {
    "1": 2,
    "2": 1,
    "3": 3,
    // ... all 9 answers
  },
  "language": "en",
  "userId": "2024092301a1b2c3d4e5f6",  // optional
  "sessionId": "sess_abc123"           // optional
}
```

### Response Format
```javascript
{
  "success": true,
  "data": {
    "userId": "2024092301a1b2c3d4e5f6",
    "testResults": {
      "rawScore": 12,
      "maxPossibleScore": 27,
      "percentile": 44,
      "severity": {
        "level": "moderate",
        "label": "Moderate depression"
      },
      "interpretation": {
        "min": 10,
        "max": 14,
        "severity": { "en": "Moderate depression" }
      },
      "recommendations": [...]
    },
    "recommendations": [...],
    "timestamp": "2024-09-23T10:30:00Z"
  }
}
```

### Batch Submit Multiple Tests
```javascript
POST /api/v1/answers/batch
Content-Type: application/json

{
  "tests": [
    {
      "testName": "phq9",
      "answers": { "1": 2, "2": 1, ... }
    },
    {
      "testName": "gad7", 
      "answers": { "1": 3, "2": 2, ... }
    }
  ],
  "language": "en",
  "userId": "2024092301a1b2c3d4e5f6"
}
```

## 🧠 Advanced Features

### Personality-Based Recommendations
For MBTI personality types, the system provides:
- Type-specific coping strategies
- Tailored intervention approaches
- Personality-aware therapy recommendations
- Learning style considerations

### Recommendation Categories
- **Meditation**: Mindfulness, breathing exercises, guided meditation
- **Counseling**: Professional therapy, support groups, crisis resources
- **Lifestyle**: Exercise, nutrition, sleep hygiene, routine building
- **Social**: Community connections, relationship building
- **Medical**: Professional evaluation, medication consideration
- **Educational**: Self-help resources, books, articles

## 🗃 Database Schema

### Collections
- **user_results**: Test results with anonymous user IDs
- **recommendations**: Personalized recommendations
- **user_analytics**: Privacy-preserving usage statistics
- **system_analytics**: Aggregate system statistics (no personal data)

### Privacy Design
- Anonymous user IDs (timestamp + random hash)
- IP and device information hashed
- No personally identifiable information stored
- Automatic data cleanup after retention period
- User analytics opt-out support

## 🔒 Privacy & Security

### Anonymous User System
```javascript
// Anonymous ID format: 2024092301a1b2c3d4e5f6
// 10 digits (timestamp) + 12 hex characters (random)
const anonymousId = generateAnonymousId();
```

### Data Protection
- All sensitive data hashed using SHA-256
- IP addresses hashed for analytics
- User agent strings hashed for device tracking
- No session cookies or authentication required
- CORS protection for API access

### Data Retention
- User results: 1 years maximum
- Recommendations: Until expiry date
- Analytics: Aggregated data only
- Automatic cleanup processes

## 🌍 Multilingual Support

### Supported Languages
- **English (en)**: Default language
- **Kashmiri (ks)**: Regional language support

### Language Features
- Test questions translated
- Response options localized
- Severity interpretations translated
- Recommendations in user's language
- Error messages localized

## 📈 System Monitoring

### Health Check
```http
GET /api/health
```

Returns system status, database connectivity, memory usage, and uptime.

### Analytics
- Test completion rates
- Language usage statistics
- Popular test combinations
- System performance metrics
- Error tracking and monitoring

## 🚦 Error Handling

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (invalid data)
- **404**: Not Found (test/user not found)
- **429**: Too Many Requests (rate limiting)
- **500**: Internal Server Error

### Error Response Format
```javascript
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error description"
}
```

## 🔄 Development Workflow

### Running in Development
```bash
npm run dev
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Validate test data
node src/scripts/validateTestData.js
```

### Database Seeding
```bash
npm run seed
```

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper CORS origins
4. Enable rate limiting
5. Configure data retention policies
6. Set up monitoring and logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open Pull Request

## 📄 License

ISC License - see LICENSE file for details.

## 🤝 Support

For support and questions:
- Check the API documentation: `GET /api/docs`
- Review health status: `GET /api/health`
- Contact: [Your contact information]

---

**Built with ❤️ for mental health awareness and support**
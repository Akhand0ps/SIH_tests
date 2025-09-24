# Mental Health API Testing Directory

This directory contains all testing resources for the Mental Health Tests API.

## 📁 Directory Structure

```
testing/
├── README.md                 # This file - testing documentation
├── postman/                  # Postman collection and environment files
│   ├── collection.json       # Complete Postman collection
│   ├── environment.json      # Environment variables
│   └── test-scenarios.md     # Detailed test scenarios
├── sample-data/              # Sample request/response data
│   ├── test-requests.json    # All test request samples
│   ├── valid-user-ids.json   # Pre-generated valid user IDs
│   └── expected-responses.json # Expected API responses
└── curl-examples/            # cURL command examples
    ├── system-health.sh      # Health check commands
    ├── submit-tests.sh       # Test submission commands
    └── user-data.sh          # User data retrieval commands
```

## 🚀 Quick Start

### 1. System Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Generate Test User ID
```bash
curl http://localhost:3000/api/generate-test-id
```

### 3. Submit Depression Test
```bash
curl -X POST http://localhost:3000/api/v1/answers/phq9 \
  -H "Content-Type: application/json" \
  -d @sample-data/phq9-request.json
```

## 📊 Available Tests

| Test Name | Questions | Description |
|-----------|-----------|-------------|
| PHQ-9     | 9         | Depression screening |
| GAD-7     | 7         | Anxiety screening |
| 16PER     | 8         | MBTI personality type |
| WHO-5     | 5         | Well-being index |
| BRS       | 6         | Resilience scale |
| ISI       | 7         | Insomnia severity |
| MBI-SS    | 7         | Academic burnout |
| GHQ-12    | 12        | General health |
| PSS-10    | 10        | Perceived stress |
| K10       | 10        | Psychological distress |
| UCLA      | 8         | Loneliness scale |
| AUDIT     | 10        | Alcohol use screening |

## 🔧 Environment Setup

Base URL: `http://localhost:3000`
API Base: `http://localhost:3000/api/v1`

Valid User ID Format: `YYYYMMDDHH` + `12 hex chars`
Example: `2025092410abcdef123456`

## 📋 Test Scenarios

1. **Complete User Journey** - Single user takes multiple tests
2. **Error Handling** - Test validation and error responses
3. **Batch Processing** - Submit multiple tests at once (if available)
4. **Multilingual Support** - Test English and Kashmiri languages
5. **Data Retrieval** - Get test questions and user history

## 🎯 Testing Workflow

1. Start server: `npm start`
2. Health check: `GET /api/health` (if available)
3. Get test questions: `GET /api/questions/{testName}`
4. Submit tests: `POST /api/v1/answers/{testName}`
5. View history: `GET /api/v1/answers/user/{userId}`
6. Get available tests: `GET /api/v1/answers/tests`
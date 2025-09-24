# cURL Examples

This directory contains command-line examples for testing the mental health API endpoints.

## Authentication
All requests require a valid user ID in the format: 10 digits + 12 hex characters (e.g., 2025092410abcdef123456)

## Individual Test Submissions

### PHQ-9 Depression Test
```bash
curl -X POST http://localhost:3000/api/v1/answers/phq9 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 2, "2": 1, "3": 3, "4": 2, "5": 1, 
      "6": 2, "7": 3, "8": 1, "9": 2
    },
    "language": "en",
    "userId": "2025092410abcdef123456"
  }'
```

### GAD-7 Anxiety Test
```bash
curl -X POST http://localhost:3000/api/v1/answers/gad7 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 3, "2": 2, "3": 3, "4": 1, 
      "5": 2, "6": 3, "7": 2
    },
    "language": "en",
    "userId": "2025092410fedcba654321"
  }'
```

### MBTI/16PER Personality Test
```bash
curl -X POST http://localhost:3000/api/v1/answers/16per \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 4, "2": 2, "3": 5, "4": 1, 
      "5": 4, "6": 2, "7": 3, "8": 3
    },
    "language": "en",
    "userId": "2025092410123456abcdef"
  }'
```

### WHO-5 Well-being Test
```bash
curl -X POST http://localhost:3000/api/v1/answers/who5 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 3, "2": 2, "3": 4, "4": 3, "5": 2
    },
    "language": "en",
    "userId": "2025092410654321fedcba"
  }'
```

### Brief Resilience Scale
```bash
curl -X POST http://localhost:3000/api/v1/answers/brs \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 4, "2": 2, "3": 4, "4": 3, "5": 4, "6": 2
    },
    "language": "en",
    "userId": "2025092410987654321abc"
  }'
```

### Insomnia Severity Index
```bash
curl -X POST http://localhost:3000/api/v1/answers/isi \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 2, "2": 3, "3": 2, "4": 3, 
      "5": 2, "6": 3, "7": 2
    },
    "language": "en",
    "userId": "2025092410abcdef987654"
  }'
```

## Batch Test Submission
```bash
curl -X POST http://localhost:3000/api/v1/answers/batch \
  -H "Content-Type: application/json" \
  -d '{
    "tests": [
      {
        "testName": "phq9",
        "answers": {"1": 2, "2": 1, "3": 3, "4": 2, "5": 1, "6": 2, "7": 3, "8": 1, "9": 2}
      },
      {
        "testName": "gad7", 
        "answers": {"1": 3, "2": 2, "3": 3, "4": 1, "5": 2, "6": 3, "7": 2}
      },
      {
        "testName": "who5",
        "answers": {"1": 3, "2": 2, "3": 4, "4": 3, "5": 2}
      }
    ],
    "language": "en",
    "userId": "2025092410111222333444"
  }'
```

## Data Retrieval

### Get Test Questions
```bash
# Get PHQ-9 questions in English
curl http://localhost:3000/api/questions/phq9?language=en

# Get GAD-7 questions in Kashmiri
curl http://localhost:3000/api/questions/gad7?language=ks

# Get all available tests
curl http://localhost:3000/api/v1/answers/tests
```

## Multilingual Examples

curl -X POST http://localhost:3000/api/v1/answers/phq9 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": 2, "2": 1, "3": 3, "4": 2, "5": 1, 
      "6": 2, "7": 3, "8": 1, "9": 2
    },
    "language": "ks",
    "userId": "2025092410aaabbbcccddd"
  }'
```

## Error Testing

curl -X POST http://localhost:3000/api/v1/answers/phq9 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {"1": 2},
    "language": "en",
    "userId": "invalid_id"
  }'
```

curl -X POST http://localhost:3000/api/v1/answers/phq9 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {"1": 2}
  }'
```

curl -X POST http://localhost:3000/api/v1/answers/invalid_test \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {"1": 2},
    "language": "en",
    "userId": "2025092410123abc456def"
  }'
```

## Response Format Examples

### Successful Test Submission
```json
{
  "success": true,
  "message": "Test results saved successfully",
  "result": {
    "testName": "phq9",
    "userId": "2025092410abcdef123456",
    "score": 15,
    "severity": "moderate",
    "interpretation": "Your responses indicate moderate depression symptoms...",
    "recommendations": ["Consider speaking with a mental health professional", "..."],
    "answersCount": 9,
    "submittedAt": "2025-01-24T10:30:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid user ID format. Expected format: 10 digits + 12 hex characters"
}
```

## Notes
- All timestamps are in ISO format
- Scores vary by test type and range
- Language parameter supports 'en' (English) and 'ks' (Kashmiri)
- User IDs must follow exact format: 10 digits + 12 hexadecimal characters
- All endpoints return JSON responses
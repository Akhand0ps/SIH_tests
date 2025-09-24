# Test Scenarios for Mental Health API

## Scenario 1: Complete User Journey
**Objective:** Test a complete user taking multiple mental health tests

### Steps:
1. **Health Check**
   - `GET /api/health`
   - Verify server is running

2. **Generate User ID**
   - `GET /api/generate-test-id`
   - Get valid anonymous user ID

3. **Get Test Questions**
   - `GET /api/v1/questions/phq9`
   - Verify question structure

4. **Submit Depression Test**
   - `POST /api/v1/answers/phq9`
   - Use generated user ID

5. **Submit Anxiety Test**
   - `POST /api/v1/answers/gad7`
   - Same user ID, different session

6. **View Test History**
   - `GET /api/v1/answers/user/{userId}`
   - Verify both tests appear

### Expected Results:
- All tests submit successfully
- User history shows 2 tests
- Test results properly stored

---

## 🎯 Scenario 2: Personality Testing
**Objective:** Test MBTI personality assessment

### Steps:
1. **Get MBTI Questions**
   - `GET /api/v1/questions/16per`
   - Verify 8 questions with trait assignments

2. **Submit Personality Test**
   - `POST /api/v1/answers/16per`
   - Use all 8 answers (not 20!)

3. **Check Results**
   - Verify personality type calculation
   - Check trait scores (I/E, S/N, T/F, J/P)

### Expected Results:
- Personality type assigned (e.g., "INTJ")
- Trait percentages calculated
- Description provided

---

## 🎯 Scenario 3: Error Handling
**Objective:** Test validation and error responses

### Steps:
1. **Invalid User ID**
   - `POST /api/v1/answers/phq9`
   - Use `"invalid_user_id"`
   - Should get validation error

2. **Missing Answers**
   - `POST /api/v1/answers/phq9`
   - Send only 5 answers instead of 9
   - Should get validation error

3. **Invalid Test Name**
   - `POST /api/v1/answers/nonexistent_test`
   - Should get 404 error

4. **Validation Endpoint**
   - `POST /api/v1/answers/phq9/validate`
   - Test with incomplete answers

### Expected Results:
- Proper error messages
- Correct HTTP status codes
- No data corruption

---

## 🎯 Scenario 4: Batch Processing
**Objective:** Test submitting multiple tests at once

### Steps:
1. **Batch Submission**
   - `POST /api/v1/answers/batch`
   - Submit PHQ-9, GAD-7, WHO-5 together

2. **Verify Results**
   - Check all tests processed
   - Verify same session ID assigned

### Expected Results:
- All tests processed successfully
- Consistent user data
- Proper error handling for any failed tests

---

## 🎯 Scenario 5: Multilingual Support
**Objective:** Test English and Kashmiri language support

### Steps:
1. **English Questions**
   - `GET /api/v1/questions/phq9?language=en`

2. **Kashmiri Questions**
   - `GET /api/v1/questions/phq9?language=ks`

3. **Submit with Language**
   - `POST /api/v1/answers/phq9`
   - Include `"language": "ks"`

### Expected Results:
- Questions in requested language
- Results/interpretations in correct language

---

## 🎯 Scenario 7: Data Validation
**Objective:** Test all question counts are correct

### Steps:
For each test, verify:
- Question count matches expected
- Answer validation works
- Score calculation is accurate

### Test Counts to Verify:
- PHQ-9: 9 questions
- GAD-7: 7 questions  
- 16PER: 8 questions
- WHO-5: 5 questions
- BRS: 6 questions
- ISI: 7 questions
- MBI-SS: 7 questions

---

## 📊 Performance Testing
**Objective:** Test system under load

### Steps:
1. **Rapid Submissions**
   - Submit multiple tests quickly
   - Check response times

2. **Large User Base**
   - Generate multiple user IDs
   - Submit tests for many users

3. **Database Queries**
   - Test user history with many results
   - Check insight generation performance

### Expected Results:
- Response times under 2 seconds
- No data corruption under load
- Proper error handling
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// If you strongly agree with facts/details → You get high S points
// If you strongly agree with abstract concepts → You get high N points ... yaad rakh


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ScoringService {

    constructor() {
        this.testDataCache = new Map();
        this.loadTestData();
    }

    // Load all test data into memory for faster access
    loadTestData() {
        const dataDir = path.join(__dirname, "../data");
        const testFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
        
        testFiles.forEach(file => {
            const testName = file.replace('.json', '');
            const testData = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
            this.testDataCache.set(testName, testData);
        });
    }

    calculateScore(testName, answers, language = 'en') {

        const testData = this.testDataCache.get(testName.toLowerCase());

        if (!testData) {
            throw new Error(`Test ${testName} not found`);
        }

        // Validate answers
        this.validateAnswers(testData, answers);

        let result = {};
        
        switch (testName.toLowerCase()) {
            case '16per':
            case 'mbti':
                result = this.scoreMBTI(testData, answers, language);
                break;
            case 'mbiss':
                result = this.scoreMBISS(testData, answers, language);
                break;
            default:
                result = this.scoreStandardTest(testData, answers, language);
        }

        // Add metadata
        result.testName = testName;
        result.language = language;
        result.completedAt = new Date().toISOString();
        result.totalQuestions = this.getTotalQuestions(testData);

        return result;
    }

    // Validate that all required answers are provided
    validateAnswers(testData, answers) {
        const expectedQuestions = this.getTotalQuestions(testData);
        const providedAnswers = Object.keys(answers).length;

        if (providedAnswers !== expectedQuestions) {
            throw new Error(`Expected ${expectedQuestions} answers, got ${providedAnswers}`);
        }

        // Validate answer values are within expected range
        for (const [questionId, answer] of Object.entries(answers)) {
            const questionNum = parseInt(questionId);
            if (isNaN(questionNum) || questionNum < 1 || questionNum > expectedQuestions) {
                throw new Error(`Invalid question ID: ${questionId}`);
            }
            
            if (typeof answer !== 'number' || answer < 0) {
                throw new Error(`Invalid answer value for question ${questionId}: ${answer}`);
            }
        }
    }

    // Standard scoring for most mental health tests
    scoreStandardTest(testData, answers, language) {
        let totalScore = 0;
        const reverseScoredQuestions = testData.scoring?.reverseScoredQuestions || [];
        const maxScore = this.getMaxScore(testData);

        // Calculate raw score
        for (const [questionId, answer] of Object.entries(answers)) {
            const questionNum = parseInt(questionId);
            let score = answer;

            // Handle reverse scoring
            if (reverseScoredQuestions.includes(questionNum)) {
                score = this.reverseScore(answer, testData);
            }

            totalScore += score;
        }

        // Get severity interpretation
        const interpretation = this.getInterpretation(testData, totalScore, language);
        
        // Calculate percentile (simplified - in real app you'd have normative data)
        const percentile = this.calculatePercentile(totalScore, maxScore);

        return {
            rawScore: totalScore,
            maxPossibleScore: maxScore,
            percentile: percentile,
            severity: interpretation.severity,
            interpretation: interpretation,
            recommendations: this.generateRecommendations(testData.testType, interpretation, language)
        };
    }

    // MBTI personality scoring - calculates trait scores
    scoreMBTI(testData, answers, language) {
        const traits = {
            'I/E': { I: 0, E: 0 },
            'S/N': { S: 0, N: 0 },
            'T/F': { T: 0, F: 0 },
            'J/P': { J: 0, P: 0 }
        };
        testData.questions.forEach((question, index) => {
            const questionId = (index + 1).toString();
            const answer = answers[questionId];
            const trait = question.trait;

            if (trait && traits[trait]) {
                // Questions with even IDs favor second trait, odd IDs favor first trait
                const questionNum = question.id;
                const isEvenQuestion = questionNum % 2 === 0;
                
                if (trait === 'I/E') {
                    if (isEvenQuestion) {
                        traits[trait].I += (6 - answer); // Reverse for introversion questions
                        traits[trait].E += answer;
                    } else {
                        traits[trait].E += answer;
                        traits[trait].I += (6 - answer);
                    }
                } else if (trait === 'S/N') {
                    if (isEvenQuestion) {
                        traits[trait].N += answer;
                        traits[trait].S += (6 - answer);
                    } else {
                        traits[trait].S += answer;
                        traits[trait].N += (6 - answer);
                    }
                } else if (trait === 'T/F') {
                    if (isEvenQuestion) {
                        traits[trait].F += answer;
                        traits[trait].T += (6 - answer);
                    } else {
                        traits[trait].T += answer;
                        traits[trait].F += (6 - answer);
                    }
                } else if (trait === 'J/P') {
                    if (isEvenQuestion) {
                        traits[trait].P += answer;
                        traits[trait].J += (6 - answer);
                    } else {
                        traits[trait].J += answer;
                        traits[trait].P += (6 - answer);
                    }
                }
            }
        });

        // Determine personality type
        const personalityType = 
            (traits['I/E'].I > traits['I/E'].E ? 'I' : 'E') +
            (traits['S/N'].S > traits['S/N'].N ? 'S' : 'N') +
            (traits['T/F'].T > traits['T/F'].F ? 'T' : 'F') +
            (traits['J/P'].J > traits['J/P'].P ? 'J' : 'P');

        return {
            personalityType: personalityType,
            traitScores: traits,
            traitPercentages: this.calculateTraitPercentages(traits),
            description: this.getMBTIDescription(personalityType, language), // could be used LLm for better description 
            recommendations: this.generateMBTIRecommendations(personalityType, language) // can use LLM for better recommendations
        };
    }

    // MBI-SS scoring - handles three dimensions
    scoreMBISS(testData, answers, language) {
        const dimensions = {
            emotionalExhaustion: 0, //ye bolra kitna drained feel kre rhe study se
            cynicism: 0, // kitne negative bn chuke ho studies ko leke
            academicEfficacy: 0 // ek dam mst ho confident 
        };

        // Calculate scores for each dimension
        for (const [dimension, questionIds] of Object.entries(testData.dimensions)) {
            for (const questionId of questionIds) {
                const answer = answers[questionId.toString()];
                if (answer !== undefined) {
                    dimensions[dimension] += answer;
                }
            }
        }

        const interpretations = {};
        for (const [dimension, score] of Object.entries(dimensions)) {

            const dimensionScoringData = testData.scoring[dimesion];
            const adaptedTestData = {scoring:dimensionScoringData};

            interpretations[dimension] = this.getInterpretation(
                adaptedTestData, 
                score,
                language
            );
        }

        return {
            dimensionScores: dimensions,
            interpretations: interpretations,
            overallBurnoutRisk: this.calculateBurnoutRisk(dimensions, language),
            recommendations: this.generateBurnoutRecommendations(dimensions, interpretations, language)
        };
    }

    // Reverse score calculation based on test options
    reverseScore(score, testData) {
        const maxValue = Math.max(...testData.options.map(opt => opt.value));
        const minValue = Math.min(...testData.options.map(opt => opt.value));
        return maxValue + minValue - score;
    }

    getInterpretation(testData, score, language) {
        
        if (!testData.scoring?.interpretation) {
            return { severity: { [language]: "No interpretation available" } };
        }

        for (const range of testData.scoring.interpretation) {
            if (score >= range.min && score <= range.max) {
                return range;
            }
        }

        return { severity: { [language]: "Score out of range" } };
    }

    // Calculate percentile (simplified version)
    calculatePercentile(score, maxScore) {
        // In a real application, this would use normative data
        // For now, using a simple linear transformation
        return Math.round((score / maxScore) * 100);
    }

    // Calculate trait percentages for MBTI
    calculateTraitPercentages(traits) {
        const percentages = {};
        
        for (const [trait, scores] of Object.entries(traits)) {
            const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
            percentages[trait] = {};
            
            for (const [subTrait, score] of Object.entries(scores)) {
                percentages[trait][subTrait] = Math.round((score / total) * 100);
            }
        }
        
        return percentages;
    }

    // Calculate overall burnout risk
    calculateBurnoutRisk(dimensions, language) {
        const { emotionalExhaustion, cynicism, academicEfficacy } = dimensions;
        
        let riskLevel = 'low';
        
        if (emotionalExhaustion >= 10 && cynicism >= 6 && academicEfficacy <= 6) {
            riskLevel = 'high';
        } else if (emotionalExhaustion >= 6 || cynicism >= 4) {
            riskLevel = 'moderate';
        }

        const riskLabels = {
            en: { low: 'Low risk', moderate: 'Moderate risk', high: 'High risk' },
            ks: { low: 'کم خطرہ', moderate: 'درمیانہ خطرہ', high: 'زیادہ خطرہ' }
        };

        return {
            level: riskLevel,
            label: riskLabels[language]?.[riskLevel] || riskLabels.en[riskLevel]
        };
    }

    getTotalQuestions(testData) {
        if (Array.isArray(testData)) {
            return testData.length; // PHQ9 format
        }
        return testData.questions?.length || 0;
    }

    // Get maximum possible score
    getMaxScore(testData) {
        const totalQuestions = this.getTotalQuestions(testData);
        const maxValue = Math.max(...(testData.options?.map(opt => opt.value) || [4]));
        return totalQuestions * maxValue;
    }

    generateRecommendations(testType, interpretation, language) {
        
        const basicRecommendations = {
            en: {
                low: ["Continue maintaining good mental health habits", "Regular exercise and healthy sleep"],
                moderate: ["Consider stress management techniques", "Seek support from friends or family"],
                high: ["Consider professional counseling", "Practice mindfulness and relaxation techniques"]
            },
            ks: {
                low: ["اچھی ذہنی صحت کی عادات برقرار رکھیں", "باقاعدہ ورزش اور صحت مند نیند"],
                moderate: ["دباؤ کو کنٹرول کرنے کی تکنیک آزمائیں", "دوستوں یا خاندان سے مدد لیں"],
                high: ["پیشہ ورانہ مشورہ لینے پر غور کریں", "ذہن سازی اور آرام کی تکنیک آزمائیں"]
            }
        };

        const severityLevel = this.getSeverityLevel(interpretation);
        return basicRecommendations[language]?.[severityLevel] || basicRecommendations.en[severityLevel] || [];
    }

    generateMBTIRecommendations(personalityType, language) {
        // This will be enhanced with more specific recommendations
        const recommendations = {
            en: [`Recommendations for ${personalityType} personality type coming soon`],
            ks: [`${personalityType} شخصیت کی قسم کے لیے تجاویز جلد آرہی ہیں`]
        };

        return recommendations[language] || recommendations.en;
    }

    // Generate burnout-specific recommendations
    generateBurnoutRecommendations(dimensions, interpretations, language) {
        const recommendations = [];
        
        if (dimensions.emotionalExhaustion > 10) {
            recommendations.push(
                language === 'ks' ? 
                "جذباتی تھکاوٹ کم کرنے کے لیے آرام کی تکنیک آزمائیں" : 
                "Practice relaxation techniques to reduce emotional exhaustion"
            );
        }
        
        if (dimensions.cynicism > 6) {
            recommendations.push(
                language === 'ks' ? 
                "مثبت سوچ اور حوصلہ افزائی پر توجہ دیں" : 
                "Focus on positive thinking and motivation"
            );
        }
        
        if (dimensions.academicEfficacy < 6) {
            recommendations.push(
                language === 'ks' ? 
                "تعلیمی اہداف اور کامیابیاں منانا" : 
                "Set achievable academic goals and celebrate successes"
            );
        }

        return recommendations;
    }

    // Get MBTI description
    getMBTIDescription(personalityType, language) {
        const descriptions = {
            en: {
                'INTJ': 'The Architect - Imaginative and strategic thinkers',
                'INTP': 'The Thinker - Innovative inventors with an unquenchable thirst for knowledge',
                // Add more types...
            },
            ks: {
                'INTJ': 'معمار - تخیلاتی اور حکمت عملی سوچنے والے',
                'INTP': 'مفکر - علم کی لاتعداد پیاس کے ساتھ نوآور موجد',
                // Add more types...
            }
        };

        return descriptions[language]?.[personalityType] || descriptions.en[personalityType] || `${personalityType} personality type`;
    }

    // Helper to determine severity level
    getSeverityLevel(interpretation) {
        if (!interpretation || !interpretation.severity) return 'moderate';
        
        const severityText = Object.values(interpretation.severity)[0].toLowerCase();
        
        if (severityText.includes('low') || severityText.includes('minimal') || severityText.includes('good')) {
            return 'low';
        } else if (severityText.includes('high') || severityText.includes('severe')) {
            return 'high';
        }
        
        return 'moderate';
    }

    // Get available tests
    getAvailableTests() {
        return Array.from(this.testDataCache.keys());
    }

    // Get test metadata
    getTestMetadata(testName, language = 'en') {
        const testData = this.testDataCache.get(testName.toLowerCase());
        if (!testData) {
            throw new Error(`Test ${testName} not found`);
        }

        // Generate description based on test type
        const descriptions = {
            'GAD-7': {
                en: 'A 7-item questionnaire to assess generalized anxiety disorder symptoms over the past 2 weeks.',
                ks: 'عمومی بے چینی رُوگ کی علامات کا اندازہ لگانے کے لیے ۷ سوالی سوالنامہ۔'
            },
            'PHQ-9': {
                en: 'A 9-item questionnaire to assess depression severity over the past 2 weeks.',
                ks: 'ماضی کے ۲ ہفتوں میں ڈپریشن کی شدت کا اندازہ لگانے کے لیے ۹ سوالی سوالنامہ۔'
            },
            'MBTI': {
                en: 'A personality assessment based on Carl Jung\'s theory of psychological types.',
                ks: 'کارل جنگ کے نفسیاتی اقسام کے نظریے پر مبنی شخصیت کا جائزہ۔'
            },
            'AUDIT': {
                en: 'A 10-item screening tool to identify hazardous and harmful alcohol consumption.',
                ks: 'خطرناک اور نقصان دہ شراب نوشی کی شناخت کے لیے ۱۰ سوالی اسکریننگ ٹول۔'
            },
            'BRS': {
                en: 'A 6-item scale to measure the ability to bounce back from stress.',
                ks: 'تناؤ سے واپس آنے کی صلاحیت کی پیمائش کے لیے ۶ سوالی پیمانہ۔'
            },
            'GHQ-12': {
                en: 'A 12-item questionnaire to assess general mental health and well-being.',
                ks: 'عمومی ذہنی صحت اور بہبود کا اندازہ لگانے کے لیے ۱۲ سوالی سوالنامہ۔'
            },
            'ISI': {
                en: 'A 7-item scale to assess insomnia severity and its impact on daily life.',
                ks: 'بے خوابی کی شدت اور روزمرہ زندگی پر اس کے اثرات کا اندازہ لگانے کے لیے ۷ سوالی پیمانہ۔'
            },
            'K10': {
                en: 'A 10-item scale to measure psychological distress and mental health.',
                ks: 'نفسیاتی پریشانی اور ذہنی صحت کی پیمائش کے لیے ۱۰ سوالی پیمانہ۔'
            },
            'MBI-SS': {
                en: 'A 7-item scale to assess student burnout and academic stress.',
                ks: 'طالب علم کے جلاوے اور تعلیمی تناؤ کا اندازہ لگانے کے لیے ۷ سوالی پیمانہ۔'
            },
            'PSS-10': {
                en: 'A 10-item scale to measure perceived stress levels in daily life.',
                ks: 'روزمرہ زندگی میں محسوس شدہ تناؤ کی سطح کی پیمائش کے لیے ۱۰ سوالی پیمانہ۔'
            },
            'UCLA Loneliness Scale': {
                en: 'An 8-item scale to measure subjective feelings of loneliness and social isolation.',
                ks: 'تنہائی اور سماجی علیحدگی کے ذاتی احساسات کی پیمائش کے لیے ۸ سوالی پیمانہ۔'
            },
            'WHO-5': {
                en: 'A 5-item questionnaire to assess overall well-being and quality of life.',
                ks: 'مجموعی بہبود اور زندگی کے معیار کا اندازہ لگانے کے لیے ۵ سوالی سوالنامہ۔'
            }
        };

        return {
            testType: testData.testType,
            title: testData.title?.[language] || testData.testType,
            description: descriptions[testData.testType]?.[language] || descriptions[testData.testType]?.en || '',
            totalQuestions: this.getTotalQuestions(testData),
            hasReversedItems: !!(testData.scoring?.reverseScoredQuestions?.length),
            estimatedTimeMinutes: Math.ceil(this.getTotalQuestions(testData) * 0.5), // 30 seconds per question
            estimatedTime: `${Math.ceil(this.getTotalQuestions(testData) * 0.5)}-${Math.ceil(this.getTotalQuestions(testData) * 0.5) + 2} minutes`,
            category: 'Mental Health'
        };
    }
}

export default new ScoringService();
import express from "express";
import scoringService from "../services/scoringService.js";
import { generateAnonymousId, validateAnonymousId, hashForPrivacy } from "../utils/anonymousId.js";
import { UserResult, UserAnalytics } from "../models/index.js";

const router = express.Router();

// POST /api/v1/answers/:testName - Submit answers and get results
router.post("/:testName", async (req, res) => {
    try {
        const { testName } = req.params;
        const { answers, language = 'en', userId = null } = req.body;

        // Validate request body
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({
                success: false,
                error: "Missing or invalid answers object"
            });
        }

        // Generate anonymous user ID if not provided
        const anonymousId = userId || generateAnonymousId();

        // Calculate scores using scoring service
        const results = scoringService.calculateScore(testName, answers, language);

        // Add user metadata
        results.userId = anonymousId;
        results.submittedAt = new Date().toISOString();

        // Save results to database
        try {
            const userResult = new UserResult({
                anonymousUserId: anonymousId,
                testName: testName.toLowerCase(),
                testType: results.testName,
                answers: answers,
                results: results,
                language: language,
                completedAt: new Date(),
                ipHash: req.ip ? hashForPrivacy(req.ip) : undefined,
                deviceHash: req.get('User-Agent') ? hashForPrivacy(req.get('User-Agent')) : undefined
            });

            const savedResult = await userResult.save();

            // Update user analytics
            await updateUserAnalytics(anonymousId, testName.toLowerCase(), language);

            res.status(200).json({
                success: true,
                data: {
                    userId: anonymousId,
                    testResults: results,
                    timestamp: new Date().toISOString(),
                    resultId: savedResult._id
                }
            });

        } catch (dbError) {
            console.error('Database save error:', dbError);
            // Still return results even if database save fails
            res.status(200).json({
                success: true,
                data: {
                    userId: anonymousId,
                    testResults: results,
                    timestamp: new Date().toISOString(),
                    warning: "Results calculated but not saved to database"
                }
            });
        }

    } catch (error) {
        console.error(`Error processing ${req.params.testName} submission:`, error);
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: `Test ${req.params.testName} not found`
            });
        }

        if (error.message.includes('Expected') || error.message.includes('Invalid')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: "Internal server error while processing test results"
        });
    }
});

// POST /api/v1/answers/batch - Submit multiple test results at once
// router.post("/batch", async (req, res) => {
//     try {
//         const { tests, language = 'en', userId = null } = req.body;

//         if (!tests || !Array.isArray(tests)) {
//             return res.status(400).json({
//                 success: false,
//                 error: "Missing or invalid tests array"
//             });
//         }

//         // Generate anonymous user ID if not provided
//         const anonymousId = userId || generateAnonymousId();

//         const results = [];
//         const errors = [];

//         // Process each test
//         for (const test of tests) {
//             try {
//                 const { testName, answers } = test;
//                 if (!testName || !answers) {
//                     errors.push({ testName, error: "Missing testName or answers" });
//                     continue;
//                 }
//                 const result = scoringService.calculateScore(testName, answers, language);
//                 result.userId = anonymousId;
//                 result.submittedAt = new Date().toISOString();
                
//                 results.push(result);
//             } catch (error) {
//                 errors.push({ testName: test.testName, error: error.message });
//             }
//         }

//         // TODO: Save batch results to database

//         res.status(200).json({
//             success: true,
//             data: {
//                 userId: anonymousId,
//                 processedTests: results.length,
//                 totalTests: tests.length,
//                 results: results,
//                 errors: errors.length > 0 ? errors : undefined,
//                 timestamp: new Date().toISOString()
//             }
//         });

//     } catch (error) {
//         console.error("Error processing batch submission:", error);
//         res.status(500).json({
//             success: false,
//             error: "Internal server error while processing batch results"
//         });
//     }
// });

// GET /api/v1/answers/tests - Get available tests metadata
router.get("/tests", (req, res) => {
    try {
        const { language = 'en' } = req.query;
        const availableTests = scoringService.getAvailableTests();
        
        const testsMetadata = availableTests.map(testName => {
            try {
                return scoringService.getTestMetadata(testName, language);
            } catch (error) {
                return { testName, error: error.message };
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalTests: availableTests.length,
                language: language,
                tests: testsMetadata
            }
        });

    } catch (error) {
        console.error("Error fetching tests metadata:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error while fetching tests metadata"
        });
    }
});

// POST /api/v1/answers/:testName/validate - Validate answers before submission
router.post("/:testName/validate", (req, res) => {
    try {
        const { testName } = req.params;
        const { answers } = req.body;

        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({
                success: false,
                error: "Missing or invalid answers object"
            });
        }

        // This will throw an error if validation fails
        const testData = scoringService.testDataCache.get(testName.toLowerCase());
        if (!testData) {
            return res.status(404).json({
                success: false,
                error: `Test ${testName} not found`
            });
        }

        scoringService.validateAnswers(testData, answers);

        res.status(200).json({
            success: true,
            message: "Answers are valid",
            data: {
                testName: testName,
                answersCount: Object.keys(answers).length,
                expectedCount: scoringService.getTotalQuestions(testData)
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/v1/answers/user/:userId - Get user's test history (anonymous)
router.get("/user/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { language = 'en' } = req.query;

        // Validate anonymous ID format
        if (!validateAnonymousId(userId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user ID format"
            });
        }

        // Get user's test history
        const testHistory = await UserResult.find({ anonymousUserId: userId })
            .sort({ completedAt: -1 })
            .select('-ipHash -deviceHash');

        // Get user analytics
        const analytics = await UserAnalytics.findOne({ anonymousUserId: userId });

        res.status(200).json({
            success: true,
            data: {
                userId: userId,
                language: language,
                testHistory: testHistory,
                totalTests: testHistory.length,
                lastTestDate: testHistory.length > 0 ? testHistory[0].completedAt : null,
                analytics: analytics ? {
                    totalTestsTaken: analytics.totalTestsTaken,
                    preferredLanguage: analytics.preferredLanguage,
                    lastActiveDate: analytics.lastActiveDate
                } : null
            }
        });

    } catch (error) {
        console.error("Error fetching user test history:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error while fetching test history"
        });
    }
});

// Helper function to update user analytics
async function updateUserAnalytics(anonymousUserId, testName, language) {
    try {
        let analytics = await UserAnalytics.findOne({ anonymousUserId });

        if (!analytics) {
            analytics = new UserAnalytics({
                anonymousUserId,
                preferredLanguage: language,
                testsByType: { [testName]: 1 }
            });
        } else {
            analytics.totalTestsTaken += 1;
            analytics.lastActiveDate = new Date();
            
            if (!analytics.testsByType) {
                analytics.testsByType = new Map();
            }
            
            const currentCount = analytics.testsByType.get(testName) || 0;
            analytics.testsByType.set(testName, currentCount + 1);
            
            if (analytics.preferredLanguage !== language) {
                analytics.preferredLanguage = language;
            }
        }

        await analytics.save();
    } catch (error) {
        console.error('Error updating user analytics:', error);
    }
}



export default router;
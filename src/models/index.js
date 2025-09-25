import mongoose from "mongoose";

// User Results Schema
const userResultSchema = new mongoose.Schema({
    anonymousUserId: {
        type: String,
        required: true,
        index: true,
        validate: {
            validator: function(v) {
                return /^\d{10}[a-f0-9]{12}$/.test(v);
            },
            message: 'Invalid anonymous user ID format'
        }
    },

    testName: {
        type: String,
        required: true,
        lowercase: true,
        enum: ['phq9', 'gad7', 'ghq12', 'pss10', 'k10', 'who5', 'brs', 'ucla', 'isi', 'mbiss', 'audit', '16per', 'mbti']
    },

    testType: {
        type: String,
        required: true
    },

    answers: {
        type: Map,
        of: Number,
        required: true
    },

    results: {
        rawScore: Number,
        maxPossibleScore: Number,
        percentile: Number,
        
        // Severity/interpretation
        severity: {
            level: String,
            label: mongoose.Schema.Types.Mixed // Supports multilingual
        },
        
        personalityType: String,
        traitScores: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        },
        
        // MBI-SS specific
        dimensionScores: {
            emotionalExhaustion: Number,
            cynicism: Number,
            academicEfficacy: Number
        },
        burnoutRisk: {
            level: String,
            label: mongoose.Schema.Types.Mixed
        }
    },

    language: {
        type: String,
        default: 'en',
        enum: ['en', 'ks']
    },

    completedAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    // IP hash for basic analytics (privacy-preserving)
    ipHash: {
        type: String,
        select: false // Don't include in queries by default
    },

    deviceHash: {
        type: String,
        select: false
    }
}, {
    timestamps: true,
    collection: 'user_results'
});

userResultSchema.index({ anonymousUserId: 1, completedAt: -1 });
userResultSchema.index({ testName: 1, completedAt: -1 });

// Recommendations Schema
const recommendationSchema = new mongoose.Schema({
    // Link to user
    anonymousUserId: {
        type: String,
        required: true,
        index: true
    },

    // Recommendation metadata
    recommendationType: {
        type: String,
        required: true,
        enum: ['immediate', 'follow-up', 'cross-test', 'personalized']
    },

    // Based on which tests/results
    basedOnTests: [{
        testName: String,
        testResultId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserResult'
        }
    }],

    // Recommendation content
    title: {
        en: String,
        ks: String
    },

    description: {
        en: String,
        ks: String
    },

    category: {
        type: String,
        enum: ['meditation', 'counseling', 'lifestyle', 'exercise', 'social', 'medical', 'educational']
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },

    // Resources and links
    resources: [{
        type: {
            type: String,
            enum: ['article', 'video', 'app', 'book', 'service', 'exercise']
        },
        title: {
            en: String,
            ks: String
        },
        description: {
            en: String,
            ks: String
        },
        url: String,
        isLocalResource: {
            type: Boolean,
            default: false
        }
    }],

    // Tracking
    isRead: {
        type: Boolean,
        default: false
    },

    readAt: Date,

    // Expiry for time-sensitive recommendations
    expiresAt: Date,

    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'recommendations'
});

// User Analytics Schema
const userAnalyticsSchema = new mongoose.Schema({
    anonymousUserId: {
        type: String,
        required: true,
        index: true
    },

    totalTestsTaken: {
        type: Number,
        default: 0
    },

    testsByType: {
        type: Map,
        of: Number,
        default: {}
    },

    totalSessions: {
        type: Number,
        default: 0
    },

    lastActiveDate: {
        type: Date,
        default: Date.now
    },

    preferredLanguage: {
        type: String,
        enum: ['en', 'ks'],
        default: 'en'
    },

    averageTestCompletionTime: Number, 

    mentalHealthTrends: [{
        testName: String,
        trend: String, // 'improving', 'stable', 'concerning'
        period: String, // 'weekly', 'monthly'
        lastUpdated: Date
    }],

    optOutAnalytics: {
        type: Boolean,
        default: false
    },

    dataRetentionConsent: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'user_analytics'
});

// System Analytics Schema - Aggregate statistics (no personal data)
const systemAnalyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,
        index: true
    },

    // Daily aggregates
    totalTests: {
        type: Number,
        default: 0
    },

    testBreakdown: {
        type: Map,
        of: Number,
        default: {}
    },

    languageUsage: {
        en: { type: Number, default: 0 },
        ks: { type: Number, default: 0 }
    },

    // Anonymized severity distributions
    severityDistributions: {
        type: Map,
        of: {
            low: { type: Number, default: 0 },
            moderate: { type: Number, default: 0 },
            high: { type: Number, default: 0 }
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'system_analytics'
});

export const UserResult = mongoose.model('UserResult', userResultSchema);
export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
export const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);
export const SystemAnalytics = mongoose.model('SystemAnalytics', systemAnalyticsSchema);


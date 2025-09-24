import express from "express";
import cors from "cors";
import { connectDB, checkDBHealth, seedDatabase, cleanupOldData } from "./config/database.js";


import questionsRoutes from "./routes/questions.routes.js";
import answersRoutes from "./routes/answers.routes.js";

const app = express();

connectDB()
    .then(() => {
        console.log("Database connected successfully");

        seedDatabase();
        
        if (process.env.NODE_ENV === 'production') {
            setInterval(cleanupOldData, 24 * 60 * 60 * 1000); 
        }
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:5173',
        ];
        
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Anonymous-ID',
        'X-Language'
    ],
    exposedHeaders: ['X-Total-Count', 'X-User-ID'],
    maxAge: 86400 
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rate limiting would go here in production
// app.use(rateLimit({ ... }));

// API routes
app.use("/api/v1/questions", questionsRoutes);
app.use("/api/v1/answers", answersRoutes);

app.get("/api/health", async (req, res) => {

    const dbHealth = await checkDBHealth();
    
    res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
        status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
    });
});

app.get("/api/docs", (req, res) => {
    res.json({
        name: "Mental Health Tests API",
        version: "1.0.0",
        description: "API for mental health assessments and recommendations",
        endpoints: {
            "GET /api/health": "Health check",
            "GET /api/v1/questions/:testName": "Get test questions",
            "GET /api/v1/answers/tests": "Get available tests metadata",
            "POST /api/v1/answers/:testName": "Submit test answers",
            "POST /api/v1/answers/batch": "Submit multiple test answers",
            "POST /api/v1/answers/:testName/validate": "Validate answers before submission",
            "GET /api/v1/answers/user/:userId": "Get user test history",
            "GET /api/generate-test-id": "Generate valid anonymous ID for testing"
        },
        supportedLanguages: ["en", "ks"],
        supportedTests: [
            "phq9", "gad7", "ghq12", "pss10", "k10", "who5", 
            "brs", "ucla", "isi", "mbiss", "audit", "16per"
        ]
    });
});

// Helper endpoint for generating test IDs
app.get("/api/generate-test-id", async (req, res) => {
    try {
        const { generateAnonymousId } = await import('./utils/anonymousId.js');
        const testId = generateAnonymousId();
        
        res.json({
            success: true,
            data: {
                anonymousId: testId,
                format: "10 digits (YYYYMMDDHH) + 12 hex characters",
                example: "2025092410abcdef123456",
                usage: "Use this ID as 'userId' in your POST requests"
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to generate test ID"
        });
    }
});

app.get("/", (req, res) => {
    res.json({
        message: "Mental Health Tests API Server",
        version: "1.0.0",
        documentation: "/api/docs",
        health: "/api/health"
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.originalUrl,
        method: req.method
    });
});

app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    if (error.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'CORS policy violation',
            message: 'Origin not allowed'
        });
    }
    
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: 'Request body contains invalid JSON'
        });
    }
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

export default app;
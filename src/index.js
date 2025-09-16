import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server } from 'socket.io'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.config.js'
import connectDB from './db/index.db.js'
import userRouter from './routes/user.router.js'
import ocrRouter from './routes/ocr.router.js'
import trackingRouter from './routes/tracking.router.js'
import { initializeSocketIO } from './services/socket.service.js'
import { cleanupOrphanedRecords } from './middlewares/validation.middleware.js'
import cron from 'node-cron'

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling']
})
initializeSocketIO(io)

app.use(helmet({
    contentSecurityPolicy: false, 
}))

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Yatra Suraksha API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
    }
}))

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Yatra Suraksha Backend API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        documentation: '/api-docs'
    })
})

app.use('/api/users', userRouter)
app.use('/api/ocr', ocrRouter)
app.use('/api/tracking', trackingRouter)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

app.use((error, req, res, next) => {
    console.error('Global error handler:', error)
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    })
})

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

connectDB().then(() => {
    server.listen(PORT, HOST, () => {
        console.log(`🚀 Server is running on http://${HOST}:${PORT}`)
        console.log(`📱 Local access: http://localhost:${PORT}`)
        console.log(`🌐 Network access: http://<your-ip>:${PORT}`)
        console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`)
        console.log(`🔌 Socket.IO initialized for real-time tracking`)
        
        
        cron.schedule('0 2 * * *', () => {
            console.log('🔄 Running scheduled cleanup of orphaned records...');
            cleanupOrphanedRecords();
        });
        
        
        setTimeout(() => {
            cleanupOrphanedRecords();
        }, 5000);
    })
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});
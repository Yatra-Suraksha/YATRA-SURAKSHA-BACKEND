import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.config.js'
import connectDB from './db/index.db.js'
import userRouter from './routes/user.router.js'
import ocrRouter from './routes/ocr.router.js'

const app = express()


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



connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});
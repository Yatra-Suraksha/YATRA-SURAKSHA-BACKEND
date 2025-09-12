import express from 'express'
import dotenv from 'dotenv'
import connectDB from './db/index.db.js'

const app = express()
dotenv.config()

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello, World!')
})

const PORT = process.env.PORT || 3000


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    })
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.set('port', 3000);

const { MongoClient, ObjectId } = require('mongodb');

let db;

MongoClient.connect('mongodb+srv://ronakad45:eOdYpsUA4uKbQ4XR@cluster0.vat1b.mongodb.net/', (err, client)=>{
    db=client.db('AfterSchoolLessons')
})

// Middleware
app.use(cors());
app.use(express.json());

// Logger Middleware logs all requests 
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    next();
});

// Static File Middleware
app.use('/images', express.static(path.join(__dirname, 'static')));

// Root route to give list of available endpoints
app.get('/', (req, res) => {
    res.json({ 
        message: 'After School Lessons API',
        endpoints: {
            'GET /lessons': 'Get all lessons',
            'GET /lessons/:id': 'Get a specific lesson',
            'GET /search?q=query': 'Search lessons',
            'POST /orders': 'Create a new order',
            'PUT /lessons/:id': 'Update lesson spaces',
            'GET /orders': 'Get all orders',
            'GET /images/afterschoolAct.jpg': 'Get image'
        }
    });
});

// GET route which retrieves all lessons from db
app.get('/lessons', async (req, res) => {
    try {
        const lessons = await db.collection('lessons').find({}).toArray();
        console.log(`Retrieved ${lessons.length} lessons`);
        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});


// POST route to save a new order
app.post('/orders', async (req, res) => {
    try {
        const order = req.body;

        // Add timestamp to order
        order.orderDate = new Date();
        
        const result = await db.collection('orders').insertOne(order);
        console.log('Order saved with ID:', result.insertedId);
        
        res.status(201).json({ 
            message: 'Order created successfully',
            orderId: result.insertedId,
            order: order
        });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: 'Failed to save order' });
    }
});

// PUT route update lesson spaces
app.put('/lessons/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;
        const { spaces } = req.body;

        // Validate spaces value
        if (spaces === undefined || spaces < 0) {
            return res.status(400).json({ 
                message: 'Spaces must be a positive number' 
            });
        }

        // Update the lesson
        const result = await db.collection('lessons').updateOne(
            { _id: new ObjectId(lessonId) },
            { $set: { spaces: spaces } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                error: 'Lesson not found',
                message: `No lesson found with ID: ${lessonId}` 
            });
        }

        console.log(`Updated lesson ${lessonId} - new spaces: ${spaces}`);
        
        res.json({ 
            message: 'Lesson updated successfully',
            lessonId: lessonId,
            newSpaces: spaces,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating lesson:', error);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// GET route to get a specific lesson by ID
app.get('/lessons/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;
        const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });
        
        if (!lesson) {
            return res.status(404).json({ 
                error: 'Lesson not found',
                message: `No lesson found with ID: ${lessonId}` 
            });
        }
        
        res.json(lesson);
    } catch (error) {
        console.error('Error fetching lesson:', error);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});


// GET route, to get all orders
app.get('/orders', async (req, res) => {
    try {
        const orders = await db.collection('orders').find({}).toArray();
        console.log(`Retrieved ${orders.length} orders`);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

//get route search functionality
app.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.q?.toLowerCase() || '';

        // first to Get ALL lessons from MongoDB
        const lessons = await db.collection('lessons').find({}).toArray();

        //followed by filtering
        const filteredLessons = lessons.filter(lesson => {
            return (
                lesson.subject.toLowerCase().includes(searchQuery) ||
                lesson.location.toLowerCase().includes(searchQuery) ||
                lesson.price.toString().includes(searchQuery) ||
                lesson.spaces.toString().includes(searchQuery)
            );
        });

        res.json(filteredLessons);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});


// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found` 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

const port = process.env.PORT || 3000

app.listen(port)


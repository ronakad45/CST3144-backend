const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.set('port', 3000);

const MongoClient = require('mongodb').MongoClient;

let db;

MongoClient.connect('mongodb+srv://ronakad45:eOdYpsUA4uKbQ4XR@cluster0.vat1b.mongodb.net/', (err, client)=>{
    db=client.db('AfterSchoolLessons')
})

// Middleware
app.use(cors());
app.use(express.json());
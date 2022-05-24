const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.4cpv5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const run = async () => {
    try {
        await client.connect();
        const collectionProducts = client.db("continentalTools").collection("products");
        const collectionReviews = client.db("continentalTools").collection("reviews");

        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = collectionProducts.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/products/:id', async (req, res) => {
            const productsId = req.params.id;
            const query = { _id: ObjectId(productsId) };
            const result = await collectionProducts.findOne(query);
            res.send(result);
        })

        app.get('/my-reviews', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = collectionReviews.find(query);
            const myAddedReviews = await cursor.toArray();
            res.send(myAddedReviews);
        });

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = collectionReviews.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/reviews', async (req, res) => {
            const insertedReview = req.body;
            const result = await collectionReviews.insertOne(insertedReview);
            res.send(result);
        });
    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Continental Tools');
});

app.listen(port, () => {
    console.log('Listening to port', port);
});
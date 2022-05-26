const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const collectionOrders = client.db("continentalTools").collection("orders");
        const collectionNewsletter = client.db("continentalTools").collection("newsletter");
        const collectionContact = client.db("continentalTools").collection("contactUs");
        const collectionPayments = client.db("continentalTools").collection("payments");

        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = collectionProducts.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.post('/products', async (req, res) => {
            const insertedProduct = req.body;
            const result = await collectionProducts.insertOne(insertedProduct);
            res.send(result);
        });

        app.get('/products/:id', async (req, res) => {
            const productsId = req.params.id;
            const query = { _id: ObjectId(productsId) };
            const result = await collectionProducts.findOne(query);
            res.send(result);
        })

        app.delete('/products/:id', async (req, res) => {
            const deleteProduct = req.params.id;
            const query = { _id: ObjectId(deleteProduct) };
            const result = await collectionProducts.deleteOne(query);
            res.send(result);
        });

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

        app.delete('/reviews/:id', async (req, res) => {
            const deleteReview = req.params.id;
            const query = { _id: ObjectId(deleteReview) };
            const result = await collectionReviews.deleteOne(query);
            res.send(result);
        });

        app.post('/newsletter', async (req, res) => {
            const insertedEmail = req.body;
            const result = await collectionNewsletter.insertOne(insertedEmail);
            res.send(result);
        });

        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = collectionOrders.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/my-orders', async (req, res) => {
            const currentUser = req.query.email;
            const query = { email: currentUser };
            const result = await collectionOrders.find(query).toArray();
            res.send(result);
        })

        app.post('/orders', async (req, res) => {
            const insertedOrder = req.body;
            const result = await collectionOrders.insertOne(insertedOrder);
            res.send(result);
        });

        app.get('/orders/:id', async (req, res) => {
            const infoOrder = req.params.id;
            const query = { _id: ObjectId(infoOrder) };
            const result = await collectionOrders.findOne(query);
            res.send(result);
        });

        app.patch('/orders/:id', async (req, res) => {
            const orderId = req.params.id;
            const paymentInfo = req.body;
            const query = { _id: ObjectId(orderId) };
            const updateOrder = {
                $set: {
                    paid: true,
                    transectionId: paymentInfo.transectionId,
                }
            }
            const orderUpdateInfo = await collectionOrders.updateOne(query, updateOrder);
            const result = await collectionPayments.insertOne(paymentInfo);
            res.send(updateOrder);
        });

        app.patch('/manage-order/:id', async (req, res) => {
            const orderId = req.params.id;
            const query = { _id: ObjectId(orderId) };
            const updateOrder = {
                $set: {
                    shipped: true
                }
            };
            const result = await collectionOrders.updateOne(query, updateOrder);
            res.send(result);
        });

        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.product_price;
            const priceAmount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: priceAmount,
                currency: "eur",
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            });
        });

        app.delete('/orders/:id', async (req, res) => {
            const deleteOrder = req.params.id;
            const query = { _id: ObjectId(deleteOrder) };
            const result = await collectionOrders.deleteOne(query);
            res.send(result);
        });

        app.post('/contact-us', async (req, res) => {
            const insertedContact = req.body;
            const result = await collectionContact.insertOne(insertedContact);
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
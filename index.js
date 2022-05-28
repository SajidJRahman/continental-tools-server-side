const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.4cpv5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        res.status(401).send('Unauthorized Access')
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send('Access Denied');
        }
        req.decoded = decoded;
        next();
    });

}

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    });
}

const run = async () => {
    try {
        await client.connect();
        const collectionProducts = client.db("continentalTools").collection("products");
        const collectionReviews = client.db("continentalTools").collection("reviews");
        const collectionOrders = client.db("continentalTools").collection("orders");
        const collectionNewsletter = client.db("continentalTools").collection("newsletter");
        const collectionContact = client.db("continentalTools").collection("contactUs");
        const collectionPayments = client.db("continentalTools").collection("payments");
        const collectionUsers = client.db("continentalTools").collection("users");
        const collectionProfile = client.db("continentalTools").collection("profile");

        app.put('/my-profile/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set:
                    user,
            };
            const result = await collectionProfile.updateOne(query, updateDoc, options);
            res.send(result);
        });

        app.get('/my-profile/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = collectionProfile.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const query = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await collectionUsers.updateOne(query, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, accessToken: token });
        });

        app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const initiator = req.decoded.email;
            const initiatorInfo = await collectionUsers.findOne({ email: initiator });
            if (initiatorInfo.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
            else if (initiatorInfo.role === 'admin') {
                const query = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await collectionUsers.updateOne(query, updateDoc);
                res.send(result);
            }
        });

        app.get('/users', verifyToken, async (req, res) => {
            const query = {};
            const cursor = collectionUsers.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.delete('/users/:id', async (req, res) => {
            const deleteUser = req.params.id;
            const query = { _id: ObjectId(deleteUser) };
            const result = await collectionUsers.deleteOne(query);
            res.send(result);
        });

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await collectionUsers.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        });

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

        app.get('/orders', verifyToken, async (req, res) => {
            const query = {};
            const cursor = collectionOrders.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/my-orders', verifyToken, async (req, res) => {
            const currentUser = req.query.email;
            const decodedEmail = req.decoded.email;
            if (currentUser === decodedEmail) {
                const query = { email: currentUser };
                const result = await collectionOrders.find(query).toArray();
                return res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' });
            }
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
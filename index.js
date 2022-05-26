const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

//connect to mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gcqmq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect((err) => {
        const db = client.db('Tools');   
        const ToolsPackages = db.collection('ToolsPackage');
        const bookingsCollection = db.collection("bookings");
        const testimonialCollection = db.collection("testimonials");
        const usersCollection = db.collection("users");

      // ==============GET API ====================

      //GET API

      app.get("/", (req, res) => {
        res.send("Welcome to Tools World");
      });

      //GET API (Tools Package)

      app.get("/ToolsPackage", async (req, res) => {
        const result = await ToolsPackages.find({}).toArray();
        res.send(result);
      });


     //GET API (users)
      app.get("/users", async (req, res) => {
        const result = await usersCollection.find({}).toArray();
        res.send(result);
      });

      // verify admin data form database
      app.get("/users/:email", async (req, res) => {
        const email = req.params.email;
        const query = { email: email };
        const user = await usersCollection.findOne(query);
        let isAdmin = false;
        if (user?.role === "admin") {
          isAdmin = true;
        }
        // localhost:5000/users/admin@admin.com will show true
        res.json({ admin: isAdmin });
      });

     //GET API (Bookings)
      app.get("/bookings", async (req, res) => {
        let query = {};
        const email = req.query.email;
        if (email) {
          query = { email: email };
        }
        const result = await bookingsCollection.find(query).toArray();
        res.send(result);
      });

      //GET Dynamic (Bookings)
      app.get("/bookings/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await bookingsCollection.findOne(query);
        res.send(result);
      });

     //GET Dynamic (products)
      app.get("/ToolsPackage/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await ToolsPackages.findOne(query);
        res.send(result);
      });

      //GET (testimonials)
      app.get("/testimonials", async (req, res) => {
        const result = await testimonialCollection.find({}).toArray();
        res.send(result);
      });

      // ==========================POST API=========================


      //POST API (Tools Package)
      app.post("/ToolsPackage", async (req, res) => {
        const newTours = req.body;
        const result = await ToolsPackages.insertOne(newTours);
        res.send(result);
      });

      //POST API (users)
      app.post("/users", async (req, res) => {
        const user = req.body;
        const result = await usersCollection.insertOne(user);
        console.log(result);
        res.send(result);
      });

      //POST API (Bookings )
      app.post("/bookings", async (req, res) => {
        const newBooking = req.body;
        const result = await bookingsCollection.insertOne(newBooking);
        res.send(result);
      });


      //POST API (Testimonials )
      app.post("/testimonials", async (req, res) => {
        const newBooking = req.body;
        // console.log(newBooking);
        const result = await testimonialCollection.insertOne(newBooking);
        res.send(result);
      });

      // ======================DELETE API ========================
      //DELETE API(Bookings)
      app.delete("/bookings/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await bookingsCollection.deleteOne(query);
        res.send(result);
      });


      //DELETE API(drone)
      app.delete("/ToolsPackage/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await ToolsPackages.deleteOne(query);
        res.send(result);
      });


      // =================Update API====================
      app.put("/bookings/:id", async (req, res) => {
        const id = req.params.id;
        const newStatus = req.body;
        const query = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            data: newStatus.newData,
          },
        };
        const result = await bookingsCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      });

      //upsert Google user data
      app.put("/users", async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const options = { upsert: true };
        const updateDoc = { $set: user };
        const result = await usersCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.json(result);
      });

      // add admin role
      app.put("/users/admin", async (req, res) => {
        const user = req.body;
        const filter = { email: user.email };
        const updateDoc = { $set: { role: "admin" } };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.json(result);
      });
    });

    // AUTH
    app.post('/login', async (req, res) => {
        const user = req.body;
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '1d'
        });
        res.send({ accessToken });
    })

    }
    finally {

    }
}
run().catch(console.dir);


//To check is it working
app.get('/', (req, res) => {
    res.send('Running Server ToolsHouse');
});

//listen
app.listen(port, () => {
    console.log('Listening to port', port);
})
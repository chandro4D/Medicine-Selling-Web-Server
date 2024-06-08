const express = require('express');
const app = express();
// const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 7000;



// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ethrwxc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const productCollection = client.db("medicineDb").collection("products");
    const cartCollection = client.db("medicineDb").collection("carts");
    const userCollection = client.db("medicineDb").collection("users");
    // ------------users related api--------
    app.post('/users',async(req,res) => {
      const user = req.body;
      const query = {email: user.email}
      const existingUser =await userCollection.findOne(query);
      if(existingUser){
        return res.send({message: 'user already exists',insertedId:null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    // ------------get all shop products-----------------------
    app.delete('/carts/:id',async(req,res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    })
    app.get('/shop',async(req,res) => {
      const result = await productCollection.find().toArray();
      res.send(result);
  })
  // -----------------------------------------------------

  // ----------carts collection----------------
  app.post('/carts', async(req,res) => {
    const cartItem = req.body;
    const result = await cartCollection.insertOne(cartItem);
    res.send(result);
  })
  
  app.get('/carts', async(req,res) => {
    const email = req.query.email;
    const query = {email: email};
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  })
  
  // ---------------------------------------------------


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res) =>{
    res.send('medicine selling web is running');
})

app.listen(port, () => {
    console.log(`medicine selling web is running on port: ${port}`);
})
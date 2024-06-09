const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
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
    
    
    
    // jwt related api------------
    app.post('/jwt',async(req,res) => {
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, {
       expiresIn:'1h'
      });
      res.send({token});
     })
    // ------------users related api-------------------------------------------
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
    app.get('/users',async(req,res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
  })
  app.patch('/users/admin/:id',async(req,res) => {
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        role: 'admin'
      }
    }
    const result = await userCollection.updateOne(filter,updatedDoc);
    res.send(result);
  })

  app.delete('/users/:id',async(req,res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await userCollection.deleteOne(query);
    res.send(result);
  })

  // middlewares------------
  const verifyToken = (req,res,next) => {
    console.log('inside verify token',req.headers.authorization);
    if(!req.headers.authorization){
      return res.status(401).send({message:'unauthorize access'});
    }
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded) => {
      if(err){
        return res.status(401).send({message:'unauthorize access'});
      }
      req.decoded = decoded;
      next();
    })
    
   
  }
  // use verify admin after verifyToken
  const verifyAdmin = async(req,res,next) => {
    const email = req.decoded.email;
    const query = {email: email};
    const user = await userCollection.findOne(query);
    const isAdmin = user?.role === 'admin';
    if(!isAdmin){
      return res.status(403).send({message: 'forbidden access'});
    }
    next()
  }
  // use verify seller after verifyToken
  const verifySeller = async(req,res,next) => {
    const email = req.decoded.email;
    const query = {email: email};
    const user = await userCollection.findOne(query);
    const isSeller = user?.role === 'seller';
    if(!isSeller){
      return res.status(403).send({message: 'forbidden access'});
    }
    next()
  }
  app.get('/users/admin/:email',async(req,res) => {
    const email = req.params.email;
    // if(email !== req.decoded.email){
    //   return res.status(403).send({message: 'forbidden access'})
    // }
    const query = {email: email};
    const user = await userCollection.findOne(query);
    let admin = false;
    if(user){
      admin = user?.role === 'admin';
    }
    res.send({admin});

  })
  app.get('/users/seller/:email',async(req,res) => {
    const email = req.params.email;
    // if(email !== req.decoded.email){
    //   return res.status(403).send({message: 'forbidden access'})
    // }
    const query = {email: email};
    const user = await userCollection.findOne(query);
    let seller = false;
    if(user){
      seller = user?.role === 'seller';
    }
    res.send({seller});

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
  // --------------------delete item by admin--------------------
  app.delete('/shop/:id',async(req,res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await productCollection.deleteOne(query);
    res.send(result);
  })  
  app.post('/shop', async(req,res) => {
    const item = req.body;
    const result = await productCollection.insertOne(item);
    res.send(result);
  })

  app.get('/shop/:email', async (req, res) => {
    const email = req.params.email
    const query = { email : email }
    const result = await productCollection.find(query).toArray()
    res.send(result)
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
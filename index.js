const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
var jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ywq3nhp.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req, res, next) =>{
 console.log('hetting Jwt ')
 console.log(req.headers.authorization);
 const authorization = req.headers.authorization;
 if(!authorization){
  return res.status(401).send({error: true, massage: 'unauthorized access '})
 }
 const token = authorization.split(' ')[1];
 jwt.verify(token, process.env.JWT_SECRET_KEY, (error, decoded) =>{
  if(error){
    return res.status(403).send({error: true, massage: 'unauthorized access '})
  }
  req.decoded = decoded;
  next()
 })
}

async function run() {
  try {


    // jwt

    app.post('/jwt', (req, res) =>{
      const user = req.body;
      console.log(user)
      const token =  jwt.sign(user, process.env.JWT_SECRET_KEY, {expiresIn: '1h'});
      res.send({token})
    })



    const servicesCollection = client.db('carUser').collection('carUserData');
    const bookingCollection = client.db('carUser').collection('bookings')

    app.get('/services' , async(req, res ) =>{
        const cursor = servicesCollection.find();
        const result = await cursor.toArray()
        res.send(result)
    })


    app.get('/services/:id' , async(req, res) =>{
        const id = req.params.id;
        const quary = {_id : new ObjectId(id)};
        const options = {
            // Include only the `title` and `imdb` fields in each returned document
            projection: { title: 1, service_id: 1, price: 1,img: 1 , description: 1},
          };
        const result = await servicesCollection.findOne(quary, options)
        res.send(result)
    })

    app.get('/bookings', verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: true, massage: 'forbedden access'})
      }
      let query = {};
      if (req.query?.email) {
          query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
  })


  app.patch('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updatedBooking = req.body;
    console.log(updatedBooking);
    const updateDoc = {
        $set: {
            status: updatedBooking.status
        },
    };
    const result = await bookingCollection.updateOne(filter, updateDoc);
    res.send(result);
})

  app.delete('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await bookingCollection.deleteOne(query);
    res.send(result);
})

    app.post('/bookings', async(req, res) =>{
      const bookingData = req.body;
      console.log(bookingData)
      const result = await bookingCollection.insertOne(bookingData)
      res.send(result)
    })

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('doctor is running')
})

app.listen(port, () =>{
    console.log(`car doctor server is running: ${port}`)
})
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 3000;

const uri = "mongodb+srv://Freelence_dbUser:nS76YWYBw7y0uLZR@cluster0.kpqz2hg.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Freelance Marketplace Server is running');
});

async function run() {
  try{
    await client.connect();
    
    const db = client.db("freelance_marketplace");
    const usersCollection = db.collection("users");

    app.get('/users', async(req, res) =>{
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/users/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };   
      const updatedUser = req.body;
      const update = {
        $set: {
          name: updatedUser.name,
          email: updatedUser.email,
          skills: updatedUser.skills,
          bio: updatedUser.bio
        },
      };
      const result = await usersCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  finally{

  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});

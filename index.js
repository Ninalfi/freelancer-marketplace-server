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
    console.log("Successfully connected to MongoDB!");
    
    const db = client.db("freelance_marketplace");
    const jobsCollection = db.collection("jobs");

    app.get('/jobs', async(req, res) =>{
      const cursor = jobsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/jobs/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post('/jobs', async (req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    });

    app.patch('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };   
      const updatedJob = req.body;
      const update = {
        $set: {
          name: updatedJob.name,
          email: updatedJob.email,
          skills: updatedJob.skills,
          bio: updatedJob.bio
        },
      };
      const result = await jobsCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
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

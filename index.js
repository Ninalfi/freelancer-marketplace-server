const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware Setup
app.use(cors(
  {
    origin: ['http://localhost:5173'], 
    credentials: true,
  }
));
app.use(express.json());

// MongoDB Connection
const uri = "mongodb+srv://Freelence_dbUser:nS76YWYBw7y0uLZR@cluster0.kpqz2hg.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Freelance Marketplace Server is running');
});

async function run() {
  try{
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    
    const db = client.db("freelance_marketplace");
    const jobsCollection = db.collection("jobs");
    const userCollection = db.collection("users");
    const acceptedTaskCollection = db.collection("acceptedTasks");

    //user collection apis

    // app.get('/jobs', async(req, res) =>{
    //   const cursor = jobsCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

     app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      newJob.postedDateTime = new Date();
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    });
    app.get('/jobs', async (req, res) => {
            const cursor = jobsCollection.find({});
            const jobs = await cursor.toArray();
            res.send(jobs);
        });

    app.get('/jobs/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });
    app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: "Invalid Job ID format." });
            }
            const query = { _id: new ObjectId(id) };
            const job = await jobsCollection.findOne(query);

            if (!job) {
                return res.status(404).send({ message: "Job not found." });
            }
            res.send(job);
        });
    app.get('/jobs', async (req, res) => {
            const sort = req.query.sort; // e.g., ?sort=desc
            let sortCriteria = {};

            if (sort === 'desc') {
                sortCriteria = { postedDateTime: -1 };
            } else if (sort === 'asc') {
                sortCriteria = { postedDateTime: 1 };
            }

            const jobs = await jobsCollection.find().sort(sortCriteria).toArray();
            res.send(jobs);
        });

        app.get("/jobs", async (req, res) => {
        const { search } = req.query;

        let query = {};
        if (search) {
          query = {
            title: { $regex: search, $options: "i" }
          };
        }

        const result = await jobsCollection.find(query).toArray();
        res.send(result);
      });


    app.get('/latest-job', async (req, res) => {
            const result = await jobsCollection.find()
                .sort({ postedDateTime: -1 })
                .limit(6)
                .toArray();
            res.send(result);
        });   

    app.patch('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };   
      const updatedData = req.body;
      const update = {
        $set: {
          title: updatedData.title,
                    category: updatedData.category,
                    summary: updatedData.summary,
                    coverImage: updatedData.coverImage,
        },
      };
      const result = await jobsCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete('/jobs/:id', async (req, res) => {
      try {
                const id = req.params.id;
                const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to delete job" });
            }
        });

        
// POST: Accept a Task (Client: JobDetails.jsx)
        app.post('/accepted-tasks', async (req, res) => {
            const { jobId, creatorEmail, accepterEmail } = req.body;
            // Prevent accepting own job
            if (creatorEmail === accepterEmail) {
                return res.status(400).send({ message: "You cannot accept your own posted task." });
            }
            //Check if the task is already accepted by this user
            const existingAcceptance = await acceptedTaskCollection.findOne({ jobId, accepterEmail });
            if (existingAcceptance) {
                 return res.status(400).send({ message: "You have already accepted this task." });
            }

            const result = await acceptedTaskCollection.insertOne(req.body);
            res.send(result);
        });

        // My Accepted Tasks (Client: MyAcceptedTasks.jsx)
        app.get('my-accepted-task/:email', async (req, res) => {
            const email = req.params.email;
            const query = { accepterEmail: email };
            const cursor = acceptedTaskCollection.find(query);
            const tasks = await cursor.toArray();
            res.send(tasks);
        });
        app.delete('/accepted-tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await acceptedTaskCollection.deleteOne(query);
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

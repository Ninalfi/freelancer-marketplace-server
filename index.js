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

    app.get('/jobs/:id', async(req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    app.post('/jobs', async (req, res) => {
      const job = req.body;
      job.postedDateTime = new Date();
      const result = await jobsCollection.insertOne(job);
      res.send(result);
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


    app.get('/jobs/latest', async (req, res) => {
            const result = await jobsCollection.find()
                .sort({ postedDateTime: -1 })
                .limit(6)
                .toArray();
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
      try {
                const id = req.params.id;
                const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to delete job" });
            }
        });

        // POST: Accept a Task (Client: JobDetails.jsx)
        app.post('/tasks/accept', async (req, res) => {
            const { jobId, creatorEmail, accepterEmail } = req.body;

            // Challenge 3 Check: Prevent accepting own job
            if (creatorEmail === accepterEmail) {
                return res.status(400).send({ message: "You cannot accept your own posted task." });
            }
            
            // Optional: Check if the task is already accepted by this user
            const existingAcceptance = await acceptedTaskCollection.findOne({ jobId, accepterEmail });
            if (existingAcceptance) {
                 return res.status(400).send({ message: "You have already accepted this task." });
            }

            const result = await acceptedTaskCollection.insertOne(req.body);
            res.send(result);
        });

        // GET: My Accepted Tasks (Client: MyAcceptedTasks.jsx)
        app.get('/tasks/my-accepted/:email', async (req, res) => {
            const email = req.params.email;
            const query = { accepterEmail: email };
            const tasks = await acceptedTaskCollection.find(query).toArray();
            res.send(tasks);
        });

        // DELETE: Complete/Cancel Task (Client: MyAcceptedTasks.jsx)
        app.delete('/tasks/my-accepted/:id', async (req, res) => {
            try {
                const id = req.params.id;
                const result = await acceptedTaskCollection.deleteOne({ _id: new ObjectId(id) });
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to remove task acceptance" });
            }
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

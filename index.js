require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173",
    "https://assignment-11-5bae2.web.app",
    "https://assignment-11-5bae2.firebaseapp.com"
  ],
  credentials: true, optionsSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fgufh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const postCollection = client
      .db("Serve-together")
      .collection("volunteer-posts");

    const volunteerRequestCollection = client
      .db("Serve-together")
      .collection("volunteer-request");




      //jwt
      app.post("/jwt", async (req, res) =>{
       const email = req.body
       const token =  jwt.sign(email, process.env.SECRER_KEY,{expiresIn:'30d',

       })
       console.log(token)
       res.cookie("token", token,{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
       }).send("cookie success")
      })



      //jwt logout
       app.get("/logout", async (req, res) =>{
        res.clearCookie("token",{
         maxAge: 0,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }).send({success: true})
       })







    app.get("/posts/email/:email", async (req, res) => {
      const email = req.params.email;
      const query = { organizerEmail: email };
      const result = await postCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.findOne(query);
      res.send(result);
    });

    app.get("/posts", async (req, res) => {
      const { searchParams } = req.query;
      let option = {};

      if (searchParams) {
        option = { postTitle: { $regex: searchParams, $options: "i" } };
      }

      const cursor = postCollection.find(option);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/posts", async (req, res) => {
      const newPost = req.body;

      newPost.volunteersNeeded = parseInt(newPost.volunteersNeeded, 10);
      const result = await postCollection.insertOne(newPost);
      res.send(result);
    });

    app.put("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatePost = req.body;
      const newPost = {
        $set: {
          organizerName: updatePost.organizerName,
          organizerEmail: updatePost.organizerEmail,
          postTitle: updatePost.postTitle,
          thumbnail: updatePost.thumbnail,
          location: updatePost.location,
          category: updatePost.category,
          description: updatePost.description,
          volunteersNeeded: parseInt(updatePost.volunteersNeeded, 10),
          deadline: updatePost.deadline,
        },
      };
      const result = await postCollection.updateOne(filter, newPost, options);
      res.send(result);
    });

    app.delete("/posts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    app.get('/post/upcoming', async (req, res) =>{
      const result = await  postCollection.find().sort({deadline: 1}).limit(6).toArray();
      res.send(result);
    })
  
    // volunteer request api

    app.get("/post-volunteer-request", async (req, res) => {
      const email = req.query.email;
      const query = { volunteerEmail: email };
      const result = await volunteerRequestCollection.find(query).toArray();

      for (const volunteerRequest of result) {
        const query1 = { _id: new ObjectId(volunteerRequest.postId) };
        const myPost = await postCollection.findOne(query1);
        if (myPost) {
          volunteerRequest.postTitle = myPost.postTitle;
          volunteerRequest.deadline = myPost.deadline;
          volunteerRequest.category = myPost.category;
          volunteerRequest.thumbnail = myPost.thumbnail;
          volunteerRequest.location = myPost.location;
        }
      }

      res.send(result);
    });


   
    app.post("/post-volunteer-request", async (req, res) => {
      const volunteerRequest = req.body;
      const result = await volunteerRequestCollection.insertOne(
        volunteerRequest
      );

      const filter = { _id: new ObjectId(volunteerRequest.postId) };
      const update = {
        $inc: { volunteersNeeded: -1 },
      };
      const updateVolunteer = await postCollection.updateOne(filter, update);
      res.send(result);
    });

    app.delete("/post-volunteer-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerRequestCollection.deleteOne(query);
      res.send(result);
    });
 
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Volunteer posts are okay");
});

app.listen(port, () => {
  console.log(`server is running at: ${port}`);
});

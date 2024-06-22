const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173',
    'https://health-track-186e2.web.app',
    'https://health-track-186e2.firebaseapp.com'],
  credentials: true
}));
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.23qqz48.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in the development server.  in production, sameSite will be none
// in development server secure will false.  in production secure will be true



const logger = (req, res, next) => {
  console.log('Called: ', req.host, req.originalUrl);
  next();
};


async function run() {
  try {


    // await client.connect();
    console.log("Connected to MongoDB Atlas");

    const db = client.db('healthTrack');
    const userCollection = db.collection('user');
    const bannerCollection = db.collection('banner');
    const testCollection = db.collection('test');
    const bookingCollection = db.collection('booking');
    const recommendationCollection = db.collection('recommendation');


    // jwt token api

    //creating Token
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ token });
    })

    // middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    

    //clearing Token
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });










    // User API endpoints

    // Create a new user
    app.post('/users', verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { email } = req.body;
        const existingUser = await userCollection.findOne({ email });

        if (existingUser) {
          return res.status(400).json({ message: 'User already exists', insertId: null });
        }

        const result = await userCollection.insertOne(req.body);
        res.status(201).json(result.ops[0]); // Return inserted document
      } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).json({ message: 'Error inserting user', error });
      }
    });

    // Get a specific user by ID
    app.get('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const user = await userCollection.findOne({ _id: new ObjectId(id) });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: 'Error fetching user', error });
      }
    });

    // Get all users
    app.get('/users', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();

        if (!users.length) {
          return res.status(404).json({ message: 'No users found' });
        }

        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: 'Error fetching users', error });
      }
    });

    // Delete a user by ID
    app.delete('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Error deleting user', error });
      }
    });

    // Update user role to admin by ID
    app.patch('/users/admin/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'admin'
          }
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.json(result);
      } catch (error) {
        console.error("Error updating user role to admin:", error);
        res.status(500).json({ message: 'Error updating user role to admin', error });
      }
    });

    // Get user role by email
    app.get('/users/role/:email', async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ role: user.role });
      } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).json({ message: 'Error fetching user role', error });
      }
    });

    // Update user status by ID
    app.patch('/users/status/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: status
          }
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ modifiedCount: result.modifiedCount });
      } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: 'Error updating user status', error });
      }
    });

    // Get user details by ID (including tests)
    app.get('/users/:id/details', async (req, res) => {
      try {
        const id = req.params.id;
        const user = await userCollection.findOne({ _id: new ObjectId(id) });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const userDetails = {
          name: user.name,
          email: user.email,
          role: user.role,
          district: user.district,
          upazila: user.upazila,
          bloodGroup: user.bloodGroup,
          status: user.status,
          tests: user.tests || []  // Assuming tests are stored as an array in user document
        };

        res.json(userDetails);
      } catch (error) {
        console.error("Error fetching user details:", error);
        res.status(500).json({ message: 'Error fetching user details', error });
      }
    });

    // Update user profile by ID
    app.patch('/users/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { name, email, bloodGroup, district, upazila, photoURL } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            name,
            email,
            bloodGroup,
            district,
            upazila,
            photoURL,
          }
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await userCollection.findOne({ _id: new ObjectId(id) });
        res.json(updatedUser);
      } catch (error) {
        console.error('Error updating profile data:', error);
        res.status(500).json({ message: 'Error updating profile data', error });
      }
    });

    // Banner API endpoints

    // Get all banners
    app.get('/banners', async (req, res) => {
      try {
        const banners = await bannerCollection.find().toArray();
        res.json(banners);
      } catch (error) {
        console.error("Error fetching banners:", error);
        res.status(500).json({ message: 'Error fetching banners', error });
      }
    });

    // Get a specific banner by ID
    app.get('/banners/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const banner = await bannerCollection.findOne({ _id: new ObjectId(id) });

        if (!banner) {
          return res.status(404).json({ message: 'Banner not found' });
        }

        res.json(banner);
      } catch (error) {
        console.error("Error fetching banner:", error);
        res.status(500).json({ message: 'Error fetching banner', error });
      }
    });






    // Create a new banner
    app.post('/banners', async (req, res) => {
      const newBanner = req.body;
      console.log(newBanner);
      const result = await bannerCollection.insertOne(newBanner);
      res.send(result);
    });

    app.delete('/banners/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bannerCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Banner deleted successfully' });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: 'Error deleting banner', error });
      }
    });

    app.patch('/banners/:id/active', async (req, res) => {
      try {
        const id = req.params.id;

        // First, deactivate all banners
        await bannerCollection.updateMany({}, { $set: { active: false } });

        // Then, activate the specified banner
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            active: true
          }
        };
        const result = await bannerCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'Banner not found' });
        }

        res.json({ message: 'Banner set as active successfully' });
      } catch (error) {
        console.error("Error setting active banner:", error);
        res.status(500).json({ message: 'Error setting active banner', error });
      }
    });










    // Test API endpoints

    // Get all tests
    app.get('/tests', async (req, res) => {
      try {
        const tests = await testCollection.find().toArray();
        res.json(tests);
      } catch (error) {
        console.error("Error fetching tests:", error);
        res.status(500).json({ message: 'Error fetching tests', error });
      }
    });

    // Get a specific test by ID
    app.get('/tests/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const test = await testCollection.findOne({ _id: new ObjectId(id) });

        if (!test) {
          return res.status(404).json({ message: 'Test not found' });
        }

        res.json(test);
      } catch (error) {
        console.error("Error fetching test:", error);
        res.status(500).json({ message: 'Error fetching test', error });
      }
    });

    app.post('/tests', async (req, res) => {
      try {
        const tests = req.body;
        const result = await testCollection.insertOne(tests);
        res.json(result);
      } catch (error) {
        console.error("Error creating test:", error);
        res.status(500).json({ message: 'Error creating test', error });
      }
    });




    // Booking API endpoints

    // Create a new booking
    app.post('/bookings', async (req, res) => {
      try {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.json(result);
      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: 'Error creating booking', error });
      }
    });

    // Get all bookings
    app.get('/bookings', async (req, res) => {
      try {
        const bookings = await bookingCollection.find({}).toArray();
        res.json(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: 'Error fetching bookings', error });
      }
    });

    // Get a specific booking by ID
    app.get('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const booking = await bookingCollection.findOne({ _id: new ObjectId(id) });

        if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);
      } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: 'Error fetching booking', error });
      }
    });

    // Update booking status by ID
    app.patch('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            status: status
          }
        };
        const result = await bookingCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ modifiedCount: result.modifiedCount });
      } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: 'Error updating booking status', error });
      }
    });

    // Delete a booking by ID
    app.delete('/bookings/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: 'Error deleting booking', error });
      }
    });





    // Routes
    app.get('/bookings', async (req, res) => {
      try {
        const { email } = req.query;
        const query = email ? { email } : {};
        const bookings = await bookingCollection.find(query).toArray();
        res.json(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: 'Error fetching bookings', error });
      }
    });

    app.post('/api/bookings', async (req, res) => {
      try {
        const newBooking = req.body;
        const result = await bookingCollection.insertOne(newBooking);
        res.json(result.ops[0]);
      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: 'Error creating booking', error });
      }
    });

    app.delete('/api/bookings/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const query = { _id: ObjectId(id) };
        const result = await bookingCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
      } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: 'Error deleting booking', error });
      }
    });

    app.patch('/api/bookings/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { testResultUrl } = req.body;
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
          $set: {
            testResultUrl,
            status: 'Delivered' // Assuming status update for delivered test result
          }
        };
        const result = await bookingCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 0) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Test result submitted successfully' });
      } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ message: 'Error updating booking', error });
      }
    });





    // PDF Generation Endpoint
    app.get('/test-results/:resultId/download', verifyToken, async (req, res) => {
      try {
        const { resultId } = req.params;

        // Fetch test result details from MongoDB or another source
        const booking = await bookingCollection.findOne({ _id: ObjectId(resultId) });

        if (!booking) {
          return res.status(404).json({ message: 'Test result not found' });
        }

        // Fetch user details from MongoDB (assuming it's related to the booking)
        const user = await userCollection.findOne({ _id: ObjectId(booking.userId) });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Generate PDF document
        const doc = new PDFDocument();
        const pdfFileName = `${user.name}_test_result.pdf`; // Customize filename as needed

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfFileName}"`);

        doc.pipe(res);

        // Example content for the PDF
        doc.fontSize(16).text('Test Result Details', { align: 'center' });
        doc.fontSize(12).text(`User Name: ${user.name}`);
        doc.fontSize(12).text(`Test Name: ${booking.testName}`);
        doc.fontSize(12).text(`Test Date: ${new Date(booking.date).toLocaleDateString()}`);
        doc.fontSize(12).text(`Test Price: $${booking.price.toFixed(2)}`);
        doc.fontSize(12).text(`Delivery Status: ${booking.status}`);

        doc.end();
        console.log(`PDF generated and sent for test result ID ${resultId}`);
      } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
      }
    });






    // Recommendation endpoints
    app.get('/recommendations', async (req, res) => {
      try {
        const recommendations = await recommendationCollection.find({}).toArray();
        res.json(recommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        res.status(500).json({ message: 'Error fetching recommendations', error });
      }
    });

    app.post('/recommendations', async (req, res) => {
      try {
        const newRecommendation = req.body;
        const result = await recommendationCollection.insertOne(newRecommendation);
        res.status(201).json(result.ops[0]);
      } catch (error) {
        console.error("Error creating recommendation:", error);
        res.status(500).json({ message: 'Error creating recommendation', error });
      }
    });


    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);









app.get('/', (req, res) => {
  res.send("HealthTrack server is running");
});

app.listen(port, () => {
  console.log(`HealthTrack server is running on port: ${port}`);
});
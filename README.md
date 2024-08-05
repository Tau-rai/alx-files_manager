# README

# Creating an API with Express

This README provides instructions on how to create a RESTful API using Node.js and Express. We'll cover the following topics:

1. **Setting Up the Project:**
    - Create a new project directory.
    - Install dependencies, including Express.

    ```bash
    mkdir my-api
    cd my-api
    npm init -y
    npm install express
    ```

2. **Creating the Server:**
    - Initialize an Express server.
    - Set up routes for handling API requests (e.g., GET, POST, PUT, DELETE).

    ```javascript
    const express = require('express');
    const app = express();

    app.get('/users', (req, res) => {
      // Handle GET request for /users
    });

    app.post('/users', (req, res) => {
      // Handle POST request for /users
    });

    // Add more routes...

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
    ```

3. **Defining API Routes:**
    - Create route handlers for different endpoints (e.g., `/users`, `/products`).
    - Implement CRUD operations (Create, Read, Update, Delete) for data.

    ```javascript
    app.get('/users/:id', (req, res) => {
      // Handle GET request for /users/:id
    });

    app.put('/users/:id', (req, res) => {
      // Handle PUT request for /users/:id
    });

    // Add more route handlers...

    app.delete('/users/:id', (req, res) => {
      // Handle DELETE request for /users/:id
    });
    ```

---

# Authenticating Users

To authenticate users in your Express application, consider using Passport.js, a popular authentication middleware. Here's a high-level overview:

1. **Install Dependencies:**
    - Install `passport` and relevant strategies (e.g., `passport-local`, `passport-jwt`).

    ```bash
    npm install passport passport-local passport-jwt
    ```

2. **Configure Passport:**
    - Set up Passport middleware in your Express app.
    - Define authentication strategies (e.g., local, JWT).

    ```javascript
    const passport = require('passport');
    const LocalStrategy = require('passport-local').Strategy;
    const JwtStrategy = require('passport-jwt').Strategy;
    const User = require('./models/user');

    // Configure local strategy
    passport.use(new LocalStrategy(User.authenticate()));

    // Configure JWT strategy
    passport.use(new JwtStrategy({
      secretOrKey: 'your-secret-key',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    }, (payload, done) => {
      User.findById(payload.sub)
         .then(user => {
            if (user) {
              done(null, user);
            } else {
              done(null, false);
            }
         })
         .catch(err => done(err, false));
    }));

    // Initialize Passport
    app.use(passport.initialize());
    ```

3. **Implement Authentication Routes:**
    - Create routes for user registration, login, and logout.
    - Use Passport middleware to handle authentication.

    ```javascript
    app.post('/register', (req, res) => {
      // Handle user registration
    });

    app.post('/login', passport.authenticate('local'), (req, res) => {
      // Handle user login
    });

    // Add more authentication routes...

    app.get('/logout', (req, res) => {
      // Handle user logout
    });
    ```

---

# Storing Data in MongoDB

1. **Install MongoDB:**
    - Set up MongoDB locally or use a cloud-based service like MongoDB Atlas.

2. **Connect to MongoDB:**
    - Use Mongoose (an ODM) to connect to your MongoDB database.
    - Define data models (schemas) for your collections.

    ```javascript
    const mongoose = require('mongoose');

    mongoose.connect('mongodb://localhost/my-database', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
      .then(() => {
         console.log('Connected to MongoDB');
      })
      .catch(err => {
         console.error('Failed to connect to MongoDB', err);
      });

    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String
    });

    const User = mongoose.model('User', userSchema);
    ```

3. **CRUD Operations:**
    - Implement routes to create, read, update, and delete data (e.g., users, products).

    ```javascript
    app.post('/users', (req, res) => {
      const newUser = new User(req.body);
      newUser.save()
         .then(user => {
            res.json(user);
         })
         .catch(err => {
            res.status(500).json({ error: err.message });
         });
    });

    app.get('/users/:id', (req, res) => {
      User.findById(req.params.id)
         .then(user => {
            res.json(user);
         })
         .catch(err => {
            res.status(500).json({ error: err.message });
         });
    });

    // Add more CRUD routes...

    app.delete('/users/:id', (req, res) => {
      User.findByIdAndDelete(req.params.id)
         .then(() => {
            res.sendStatus(204);
         })
         .catch(err => {
            res.status(500).json({ error: err.message });
         });
    });
    ```

---

# Storing Temporary Data in Redis

1. **Install Redis:**
    - Install Redis locally or use a cloud-based Redis service.

2. **Configure Redis in Your Express App:**
    - Set up the Redis client (e.g., using the `redis` package).
    - Define functions to get and set data in Redis.

    ```javascript
    const redis = require('redis');
    const client = redis.createClient();

    client.on('connect', () => {
      console.log('Connected to Redis');
    });

    function setCache(key, value) {
      client.set(key, value);
    }

    function getCache(key, callback) {
      client.get(key, (err, reply) => {
         callback(reply);
      });
    }
    ```

3. **Use Redis for Caching:**
    - Cache frequently accessed data (e.g., API responses) in Redis.
    - Retrieve data from Redis before hitting the database.

    ```javascript
    app.get('/users', (req, res) => {
      const cacheKey = 'users';
      getCache(cacheKey, cachedData => {
         if (cachedData) {
            res.json(JSON.parse(cachedData));
         } else {
            User.find()
              .then(users => {
                 setCache(cacheKey, JSON.stringify(users));
                 res.json(users);
              })
              .catch(err => {
                 res.status(500).json({ error: err.message });
              });
         }
      });
    });
    ```

---

# Setting Up and Using a Background Worker

1. **Background Workers:**
    - Background workers perform tasks asynchronously without blocking the main thread.
    - Consider using libraries like `node-cron` or built-in timers for scheduling tasks.

2. **Example: Sending Email Notifications:**
    - Set up a background worker to send email notifications (e.g., welcome emails, password resets).
    - Execute the task periodically or based on specific events.

    ```javascript
    const cron = require('node-cron');

    cron.schedule('0 0 * * *', () => {
      // Send daily email notifications
    });

    // Example: Send welcome email to new users
    function sendWelcomeEmail(user) {
      // Send email logic
    }

    // Example: Send password reset email
    function sendPasswordResetEmail(user) {
      // Send email logic
    }

    // Schedule welcome email for new users
    app.post('/users', (req, res) => {
      const newUser = new User(req.body);
      newUser.save()
         .then(user => {
            sendWelcomeEmail(user);
            res.json(user);
         })
         .catch(err => {
            res.status(500).json({ error: err.message });
         });
    });
    ```


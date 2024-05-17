const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User');  // Assuming your User model is in models/User.js
const Course = require('./models/Course');  // Assuming your Course model is in models/Course.js
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://sosnyukk:123@cluster0.9kyeons.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));
// Setup CORS middleware
const corsOptions = {
  origin: 'http://localhost:3000', // Allow requests from this origin
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true 
};
app.use(cors(corsOptions));
const port = process.env.PORT || 5001;
app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});
// API Endpoints
// Create a new user
app.get('/courses/:courseName', async (req, res) => {
  try {
    // Extract the courseName from the request parameters
    const { courseName } = req.params;

    // Find the course in the database by its name
    const course = await Course.findOne({ courseName });

    // If the course is not found, send a 404 response
    if (!course) {
      return res.status(404).send({ message: 'Course not found' });
    }

    // If the course is found, send it in the response
    res.status(200).json(course);
  } catch (error) {
    // If an error occurs, send a 500 response with the error message
    res.status(500).json({ message: 'Error finding course', error: error.message });
  }
});
app.post('/users', async (req, res) => {
  const { nickname, email, password } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).send({ message: 'Nickname, email, and password are required' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      nickname,
      email,
      password: hashedPassword,
      courses: [],
      progress: []
    });

    await newUser.save(); // Save the user to the database
    res.status(201).send({ message: 'User created successfully', userId: newUser._id });
  } catch (error) {
    res.status(500).send({ message: 'Error creating user', error: error.message });
  }
});

// Update user information
app.put('/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).send(updatedUser);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: 'User deleted' });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Add a course to a specific user

  
  // Add a friend to a user's friend list
  app.post('/users/:userId/friends', async (req, res) => {
    const { userId } = req.params;
    const { friendId } = req.body; // ID of the friend to add
    try {
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
      if (!friend) {
        return res.status(404).send({ message: 'Friend not found' });
      }
      user.friends.push(friendId); // Add friend's ID to user's friend list
      await user.save();
      res.status(201).send(user);
    } catch (error) {
      res.status(500).send(error);
    }
  });
  
  // Add a course to a specific user
  app.post('/users/:userId/courses', async (req, res) => {
    const { userId } = req.params;
    const { courseId } = req.body;
  
    try {
      // Retrieve the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      // Retrieve the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).send({ message: 'Course not found' });
      }
  
      // Check if the course is already added to prevent duplicates
      if (user.courses.includes(courseId)) {
        return res.status(400).send({ message: 'Course already added to this user' });
      }
  
      // Add course to the user's list of courses
      user.courses.push(courseId);
  
      // Add a new progress entry for the newly added course
      user.progress.push({
        courseId: courseId,
        points: 0,
        totalPoints: 100 // Set according to your app's logic
      });
  
      // Save the user
      await user.save();
  
      // Send response
      res.status(200).send({ message: 'Course added successfully', user });
    } catch (error) {
      console.error('Error adding course to user:', error);
      res.status(500).send({ message: 'Error adding course to user', error: error.message });
    }
  });
  
  // Update progress for a user
  app.put('/users/:userId/progress/:courseId', async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).send('User not found');
  
      const progressIndex = user.progress.findIndex(p => p.courseId.toString() === req.params.courseId);
      if (progressIndex === -1) {
        return res.status(404).send('Course progress not found');
      }
  
      // Update points and totalPoints as needed
      user.progress[progressIndex].points = req.body.points;
      user.progress[progressIndex].totalPoints = req.body.totalPoints;
      await user.save();
      res.status(200).send(user.progress[progressIndex]);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  });
  
// Remove a course from a specific user
// Remove a course from a specific user
app.delete('/users/:userId/courses/:courseId', async (req, res) => {
  const { userId, courseId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Check if the course is in the user's list
    if (!user.courses.includes(courseId)) {
      return res.status(404).send({ message: 'Course not found in user\'s courses' });
    }

    // Remove the course from the courses array
    user.courses.pull(courseId); // Mongoose method to pull/remove item from array

    // Remove associated progress
    user.progress = user.progress.filter(p => p.courseId.toString() !== courseId); // Fix the filtering

    await user.save();
    res.status(200).send({ message: 'Course removed', courses: user.courses });
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.toString() });
  }
});
// Add a route to handle adding courses
app.post('/courses', async (req, res) => {
  const { courseName, language, level, topics } = req.body;

  try {
    // Create a new course
    const newCourse = new Course({
      courseName,
      language,
      level,
      topics
    });

    // Save the course to the database
    await newCourse.save();

    res.status(201).send({ message: 'Course created successfully', courseId: newCourse._id });
  } catch (error) {
    res.status(500).send({ message: 'Error creating course', error: error.message });
  }
});
// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    // If user doesn't exist
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Check if the provided password matches the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If passwords don't match
    if (!isPasswordValid) {
      return res.status(401).send({ message: 'Invalid password' });
    }

    // If authentication is successful, you can generate a token here and send it to the client for future authenticated requests

    // For now, just send a success response
    res.status(200).send({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).send({ message: 'Error logging in', error: error.message });
  }
});


app.get('/users/search/:searchTerm', async (req, res) => {
  try {
    // Extract the searchTerm from the request parameters
    const { searchTerm } = req.params;

    // Search users based on the searchTerm
    const users = await User.find({
      $or: [
        { nickname: { $regex: searchTerm, $options: 'i' } }, // Case-insensitive search for nickname
        { email: { $regex: searchTerm, $options: 'i' } } // Case-insensitive search for email
      ]
    });

    // If no users match the search term, send an empty array
    if (users.length === 0) {
      return res.status(404).send({ message: 'No users found matching the search term' });
    }

    // Send the search results
    res.status(200).json(users);
  } catch (error) {
    // If an error occurs, send a 500 response with the error message
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
});
app.get('/current-user', async (req, res) => {
  try {
    // Assuming you have some way to identify the current user, like a session or token
    // For this example, let's say you have a user ID stored in the request object
    const userId = req.userId; // Assuming userId is available in the request object

    // Find the current user by their ID
    const user = await User.findById(userId);

    // If the user is not found, send a 404 response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If the user is found, send it in the response
    res.status(200).json(user);
  } catch (error) {
    // If an error occurs, send a 500 response with the error message
    res.status(500).json({ message: 'Error fetching current user', error: error.message });
  }
});

app.get('/all-users', async (req, res) => {
  try {
    // Retrieve all users from the database
    const allUsers = await User.find();

    // If there are no users found, send a 404 response
    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    // If users are found, send them in the response
    res.status(200).json(allUsers);
  } catch (error) {
    // If an error occurs, send a 500 response with the error message
    res.status(500).json({ message: 'Error fetching all users', error: error.message });
  }
});


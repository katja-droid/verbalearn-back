const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const progressSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true }, // Store course ID instead of name
  points: { type: Number, required: true, default: 0 },
  totalPoints: { type: Number, required: true, default: 0 }
});


const userSchema = new Schema({
  nickname: String,
  email: String,
  password: String,
  courses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  progress: [progressSchema]
});

// Middleware to add progress when a course is added
// Middleware to add progress when a course is added
// Middleware to add progress when a course is added
userSchema.pre('save', async function(next) {
  if (this.isModified('courses')) {
    // Ensure that this.progress is initialized
    if (!this.progress) {
      this.progress = [];
    }
    // Use the courseId directly instead of trying to access properties of each progress item
    const existingCourses = this.progress.map(p => p.courseId.toString());
    this.courses.forEach(courseId => {
      if (!existingCourses.includes(courseId.toString())) {
        this.progress.push({ courseId: courseId, points: 0, totalPoints: 0 });
      }
    });
  }
  next();
});


// Helper method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compile and export our model
const User = mongoose.model('User', userSchema);

module.exports = User;

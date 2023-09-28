require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL);
mongoose.connection.once('connected', () => {
  console.log("db connected");
});
mongoose.connection.on('error', (err) => {
  console.error(err)
});

// user schema
const userSchema = mongoose.Schema({
  username: {
    type: String,
    uniqe: true
  },
}, {versionKey: false});

const User = mongoose.model('User', userSchema);


const exercisesSchema = mongoose.Schema({
    username: String,
    description: String,
    duration: Number,
    date: String,
    uid: String
}, {versionKey: false});

const Exercise = mongoose.model('Exercise', exercisesSchema);


app.use(cors());
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// get all user
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users)
  } catch (err) { 
    console.error(err);
    res.json({error: "no data availabel"})
  }
});

// get log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const user = await User.findById(userId);

    if (!user) {
      res.json({message: "user doesnt exist"});
    } else {
      const exercises = await Exercise.find({ uid: userId});
      const { from, to, limit } = req.query;
      let filteredExercise = exercises;

      if (from && to) {
        filteredExercise = filteredExercise.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= new Date(from) && exerciseDate <= new Date(to);
        });
      };

      if (limit) {
        const limitValue = parseInt(limit);
        filteredExercise = filteredExercise.slice(0, limitValue);
      }

      const respones = {
        username: user.username,
        count: filteredExercise.length,
        _id: userId,
        log: filteredExercise.map((exercise) =>( {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date

        }))
      };
     
      res.json(respones);

    }

  } catch (err) {
    console.error(err);
    res.json({error: "error"})
  }
});

// post new user
app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const findUser =  await User.findOne({ username: username });

  if (findUser) {
    res.json({message: "username is already exist"})  
  } else {
    const user = await User.create({
      username,
    });
    res.json(user)
  };
});

// post exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try { 
    const id = req.params._id;
    const findId = await User.findById({ _id: id })

    if (!findId) {
      res.json({message: "id doesnt exist"})
    } else {
      const userId = findId._id;
      const userName = findId.username;
      const { description, duration, date } = req.body;
      const isDate = !date ? new Date().toDateString(): new Date(date).toDateString();

      const exerciseData = new Exercise({
        username: userName,
        description,
        duration,
        date: isDate,
        uid: userId
      });

      await exerciseData.save();

      res.json({
        username: userName,
        description: exerciseData.description,
        duration: exerciseData.duration,
        date: exerciseData.date,
        _id: userId,
      })
    }
  } catch (err) {
    console.error(err);
    res.json({message: "error"})
  };
  
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

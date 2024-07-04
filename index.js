
const express =require('express')
const mongoose = require('mongoose');
require('dotenv').config()
const cors = require('cors');
// const nodeMailer = require('node-mailer');
const nodemailer = require('nodemailer');
const Otp = require('./Models/UserOTP');
const User = require('./Models/User');

const dburl = process.env.MONGOURL;
mongoose.connect(dburl)
const app = express()
const port = 8000;
app.use(express.json())
app.use(cors())


app.get('/',(req,res)=>{
    res.end("Server started")
})


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'anuragma807@gmail.com',
      pass: 'qdgcydiuuqieryny',
    },
  });
  app.post('/signup', async (req, res) => {
    const { username, email, password, phoneNumber } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists.' });
      }
  
      const newUser = new User({ username, email, password, phoneNumber });
      
      await newUser.save();
        res.status(201).json({ message: 'User registered successfully.', user: newUser });
  
      const OTP = Math.floor(1000 + Math.random() * 9000).toString();
      const otpEntry = new Otp({ email, otp: OTP });
      await otpEntry.save();
      const mailOptions = {
        from: 'anuragma807@gmail.com',
        to: email,
        subject: 'Your OTP for authentication',
        text: `Your OTP is: ${OTP}`
      };
  
      // Send OTP via email
      await transporter.sendMail(mailOptions);
  
      res.status(201).json({ message: 'User registered successfully and OTP sent.', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while registering the user or sending OTP.' });
    }
  });

 
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ error: 'User not registered', status: 'false' });
      }
  
      if (password === user.password) {
        res.status(200).json({
          message: 'Authentication successful',
          status: 'ok',
          email: user.email,
          username: user.username,
          phoneNumber: user.phoneNumber,
        });
      } else {
        res.status(401).json({ message: 'Please enter correct email or password', status: 'invalid' });
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.post('/verifyotp', async (req, res) => {
    try {
      const { email, otp } = req.body;
  
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required.', status: 'false' });
      }
  
      const otpEntry = await Otp.findOne({ email, otp });
  
      if (!otpEntry) {
        return res.status(401).json({ error: 'Invalid OTP or email.', status: 'invalid' });
      }
  
      const user = await User.findOne({ email });
      if (user) {
        return res.status(200).json({
          message: 'OTP verified successfully.',
          status: 'ok',
          user: {
            email: user.email,
            username: user.username,
            phoneNumber: user.phoneNumber,
          }
        });
      } else {
        return res.status(404).json({ error: 'User not found.', status: 'false' });
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      res.status(500).json({ error: 'Internal Server Error', status: 'false' });
    }
  });
  
app.listen(port,()=>{
    console.log("Working ", port)
})


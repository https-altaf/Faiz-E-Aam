require('dotenv').config(); // Load .env variables

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const db = require('./Db_Config/DB');
const app = express();

// Use the PORT from .env file
const PORT = process.env.PORT || 3000;

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Views folder location

// Serve static files (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET,  // Use session secret from .env
    resave: false,
    saveUninitialized: true,
  })
);

// Static admin credentials
// Get credentials from .env file
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Path to your login page
});

// Login route
app.post('/login', (req, res) => {
  const { user, psw } = req.body;

  if (user === ADMIN_USERNAME && psw === ADMIN_PASSWORD) {
    req.session.user = { username: ADMIN_USERNAME }; // Store user in session
    return res.redirect('/enquiries');
  }

  return res.status(401).send('Invalid username or password. <a href="/login">Try again</a>');
});

app.get('/enquiries', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("Unauthorized: Please <a href='/login'>login</a> first.");
  }

  db.query('SELECT * FROM enquiries', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Format the enquiryDate to YYYY-MM-DD
    results.forEach((item) => {
      let formattedDate = new Date(item.enquiryDate).toISOString().split('T')[0];
      item.enquiryDate = formattedDate;  // Update the date field
    });

    res.render('enquiries', { enquiries: results });
  });
});

// Route to handle form submission
app.post('/submit-form', (req, res) => {
  const {
    email, fullName, enquiryDate, contactNo, residentialArea, referencedBy,
    academicQualification, ssc, sscPercentage, sscYear, hscName, hscPercentage,
    hscYear, graduateName, graduatePercentage, graduateYear, postGraduateName,
    postGraduatePercentage, postGraduateYear, otherCourse, remarks
  } = req.body;

  // SQL Query to Insert Data into `enquiries` Table
  const query = `
    INSERT INTO enquiries (email, fullName, enquiryDate, contactNo, residentialArea, referencedBy, academicQualification,
        ssc, sscPercentage, sscYear, hscName, hscPercentage, hscYear, graduateName, graduatePercentage, graduateYear,
        postGraduateName, postGraduatePercentage, postGraduateYear, otherCourse, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    email, fullName, enquiryDate, contactNo, residentialArea, referencedBy, academicQualification,
    ssc, sscPercentage, sscYear, hscName, hscPercentage, hscYear, graduateName, graduatePercentage,
    graduateYear, postGraduateName, postGraduatePercentage, postGraduateYear, otherCourse, remarks
  ], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).send('There was an error submitting your enquiry.');
      return;
    }

    console.log('Data inserted successfully:', result);
    res.send('Your enquiry has been submitted successfully!');
  });

  // Send a confirmation email to the user
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // Use email from .env
      pass: process.env.EMAIL_PASS   // Use email password from .env
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thank You for Your Enquiry!',
    html: `
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <h2 style="text-align: center; color: #4CAF50;">Dear ${fullName},</h2>
              <p style="font-size: 16px; line-height: 1.5;">Thank you for your enquiry. We will contact you shortly.</p>
              <div style="text-align: center; font-size: 14px; color: #777; margin-top: 20px;">
                Best Regards,<br>Faiz-e-Aam IT Center
              </div>
            </div>
          </div>
        </body>
      </html>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.send('There was an error sending your confirmation email.');
    } else {
      console.log('Email sent:', info.response);
      res.redirect('/success');  // Redirect to success page
    }
  });
});

// Route for success page
app.get('/success', (req, res) => {
  res.send('<h1>Thank you for your enquiry!</h1>');
});

// Start the server
app.listen(PORT, () => {    
  console.log(`Server is running on http://localhost:${PORT}`);
});

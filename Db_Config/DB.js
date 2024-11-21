require('dotenv').config();
const mysql = require('mysql2');

// MySQL connection setup
const db = mysql.createConnection({
    host: process.env.DB_HOST,       // Use value from .env
    user: process.env.DB_USER,       // Use value from .env
    password: process.env.DB_PASSWORD, // Use value from .env
    database: process.env.DB_NAME    // Use value from .env
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Export the connection
module.exports = db;

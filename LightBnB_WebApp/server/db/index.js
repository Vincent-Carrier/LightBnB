const { Client } = require('pg');

const client = new Client({
  user: 'vincent',
  password: '',
  host: 'localhost',
  database: 'lightbnb'
});

client.connect();

module.exports = { client };

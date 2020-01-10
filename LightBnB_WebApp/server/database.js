const {SQL} = require('sql-template-strings');
const { client } = require('./db');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = async function(email) {
  return client.query(SQL`
    SELECT * FROM users WHERE email = ${email};
  `).then(res => res.rows[0]);
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = async function(id) {
  return client.query(SQL`
    SELECT * FROM users WHERE id = ${id};
  `).then(res => res.rows[0]);
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  client.query(SQL`
    INSERT INTO users (name, email, password) VALUES
    (${user.name}, ${user.email}, ${user.password});
  `)
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = async function(guest_id, limit = 10) {
  return client.query(SQL`
    SELECT properties.*, reservations.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id 
    WHERE reservations.guest_id = ${guest_id}
    AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT ${limit};
  `).then(res => res.rows)
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = async function(options, limit = 10) {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  let filters = [];
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    filters.push(`city LIKE $${queryParams.length}`);
  }
  if (options.minimum_rating) {
    queryParams.push(`%${options.minimum_rating}%`);
    filters.push(`rating < $${queryParams.length}`);
  }
  if (options.minimum_price_per_night) {
    queryParams.push(`%${options.minimum_price_per_night}%`);
    filters.push(`cost_per_night > $${queryParams.length}`);
  }
  if (options.maximum_price_per_night) {
    queryParams.push(`%${options.maximum_price_per_night}%`);
    filters.push(`cost_per_night < $${queryParams.length}`);
  }
  if (options.owner_id) {
    queryParams.push(`%${options.owner_id}%`);
    filters.push(`owner_id LIKE $${queryParams.length}`);
  }

  if (filters.length > 0) queryString += 'WHERE ';
  const filterStr = filters.join(' AND ');
  queryString += filterStr;
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  console.log(queryString, queryParams);

  return client.query(queryString, queryParams)
  .then(res => res.rows);
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const p = property;
  return client.query(SQL`
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code, active)
  VALUES (${p.owner_id}, ${p.title}, ${p.description}, ${p.thumbnail_photo_url}, ${p.cover_photo_url}, ${p.cost_per_night}, ${p.parking_spaces}, ${p.number_of_bathrooms}, ${p.number_of_bedrooms}, ${p.country}, ${p.street}, ${p.city}, ${p.province}, ${p.post_code}, ${p.active})
  RETURNING *;
  `)
};
exports.addProperty = addProperty;

CREATE TABLE users(
 id SERIAL PRIMARY KEY,
 email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL,
 first_name TEXT,
 last_name TEXT,
 username TEXT UNIQUE,
 country TEXT,
 phone TEXT,
 profile_photo TEXT,
 verified BOOLEAN DEFAULT false,
 vip BOOLEAN DEFAULT false,
 anonymous BOOLEAN DEFAULT false,
 admin BOOLEAN DEFAULT false,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id),
 bio TEXT,
 location TEXT
);

CREATE TABLE likes(
 id SERIAL PRIMARY KEY,
 sender INTEGER,
 receiver INTEGER,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE matches(
 id SERIAL PRIMARY KEY,
 user1 INTEGER,
 user2 INTEGER,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages(
 id SERIAL PRIMARY KEY,
 sender INTEGER,
 receiver INTEGER,
 content TEXT,
 type TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments(
 id SERIAL PRIMARY KEY,
 user_id INTEGER,
 amount INTEGER,
 method TEXT,
 status TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id),
 image TEXT NOT NULL,
 caption TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
 interests TEXT,
 looking_for TEXT,
 age_range TEXT
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
 type TEXT DEFAULT 'text',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE swipes(
 id SERIAL PRIMARY KEY,
 swiper INTEGER REFERENCES users(id),
 target INTEGER REFERENCES users(id),
 liked BOOLEAN,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts(
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id),
 caption TEXT,
 image TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile_views(
 id SERIAL PRIMARY KEY,
 viewer INTEGER REFERENCES users(id),
 viewed_user INTEGER REFERENCES users(id),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments(
 id SERIAL PRIMARY KEY,
 user_id INTEGER,
 amount DECIMAL,
 currency TEXT,
 status TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
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

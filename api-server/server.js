
require("dotenv").config()

const express=require("express")
const cors=require("cors")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const multer=require("multer")
const {Pool}=require("pg")

const app=express()

app.use(cors())
app.use(express.json())

// helper to wrap async route handlers and forward errors
function wrap(handler){
  return function(req,res,next){
    handler(req,res,next).catch(next);
  };
}

const pool=new Pool({
 connectionString:process.env.DATABASE_URL ||
 "postgres://quickmatch:quickmatch@localhost:5432/quickmatch"
})

// Test database connection
pool.connect((err, client, release) => {
 if (err) {
  console.error('Database connection failed:', err.message);
  console.log('Please ensure PostgreSQL is running and the database exists.');
  console.log('Run: docker-compose up -d');
  console.log('Or setup local PostgreSQL with the credentials in .env');
  console.log('Server will continue running but database operations will fail.');
  // Don't exit, let the server run for testing
 } else {
  console.log('Database connected successfully');
  release();
 }
});

const upload=multer({
 dest:"uploads",
 limits: {
  fileSize: 5 * 1024 * 1024 // 5MB limit
 },
 fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
   cb(null, true);
  } else {
   cb(new Error('Only image files are allowed'));
  }
 }
})

// Error handling middleware for multer
app.use((error, req, res, next) => {
 if (error instanceof multer.MulterError) {
  if (error.code === 'LIMIT_FILE_SIZE') {
   return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
 }
 if (error.message === 'Only image files are allowed') {
  return res.status(400).json({ error: error.message });
 }
 next(error);
});

function auth(req,res,next){

 const token=req.headers.authorization?.split(" ")[1]

 if(!token) return res.status(401).json({error:"no token"})

 try{
  req.user=jwt.verify(token,process.env.JWT_SECRET || "secret")
  next()
 }catch{
  res.status(401).json({error:"invalid token"})
 }

}

// ensure user is authenticated and also has admin flag
function adminAuth(req,res,next){
  auth(req,res,()=>{
    if(!req.user.admin) return res.status(403).json({error:'not admin'})
    next()
  })
}

app.get("/",(req,res)=>{
 res.json({status:"Quickmatch API running", version: "1.0.0"})
})

app.post("/register",upload.single("profilePhoto"),wrap(async(req,res)=>{

 const {email,password,firstName,lastName,username,country,phone}=req.body
 const profilePhoto=req.file?.path

 if(!firstName || !lastName || !username || !country || !phone || !profilePhoto){
  return res.status(400).json({error:"All fields including profile photo are required"})
 }

 const hash=await bcrypt.hash(password,10)

 const user=await pool.query(
 "INSERT INTO users(email,password,first_name,last_name,username,country,phone,profile_photo) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
 [email,hash,firstName,lastName,username,country,phone,profilePhoto]
 )

 res.json({userId:user.rows[0].id})

}))

app.post("/login",wrap(async(req,res)=>{

 const {email,password}=req.body

 const user=await pool.query(
 "SELECT id,email,first_name,last_name,username,country,phone,profile_photo,vip,verified,anonymous,admin FROM users WHERE email=$1",
 [email]
 )

 if(!user.rows.length) return res.status(401).json({error:"User not found"})

 const u=user.rows[0]
 const valid=await bcrypt.compare(password,u.password)

 if(!valid) return res.status(401).json({error:"Invalid password"})

 const token=jwt.sign(
 {id:u.id, admin: u.admin || false},
 process.env.JWT_SECRET || "secret"
 )

 res.json({
  token,
  user: {
   id: u.id,
   email: u.email,
   first_name: u.first_name,
   last_name: u.last_name,
   username: u.username,
   admin: u.admin
  }
 })

}))

app.get("/profile",auth,wrap(async(req,res)=>{

 const user=await pool.query(
 "SELECT id,email,first_name,last_name,username,country,phone,profile_photo,vip,verified,anonymous FROM users WHERE id=$1",
 [req.user.id]
 )

 if(!user.rows.length) return res.status(404).json({error:"user not found"})

 res.json(user.rows[0])

}))

app.put("/profile",auth,upload.single("profilePhoto"),wrap(async(req,res)=>{

 const {firstName,lastName,username,country,phone}=req.body
 const profilePhoto=req.file?.path

 const updates = []
 const values = []
 let paramCount = 1

 if(firstName) {
  updates.push(`first_name=$${paramCount}`)
  values.push(firstName)
  paramCount++
 }
 if(lastName) {
  updates.push(`last_name=$${paramCount}`)
  values.push(lastName)
  paramCount++
 }
 if(username) {
  updates.push(`username=$${paramCount}`)
  values.push(username)
  paramCount++
 }
 if(country) {
  updates.push(`country=$${paramCount}`)
  values.push(country)
  paramCount++
 }
 if(phone) {
  updates.push(`phone=$${paramCount}`)
  values.push(phone)
  paramCount++
 }
 if(profilePhoto) {
  updates.push(`profile_photo=$${paramCount}`)
  values.push(profilePhoto)
  paramCount++
 }

 if(updates.length === 0) return res.status(400).json({error:"no updates provided"})

 values.push(req.user.id)

 await pool.query(
 `UPDATE users SET ${updates.join(', ')} WHERE id=$${paramCount}`,
 values
 )

 res.json({message:"profile updated"})

}))
// posts endpoints
app.get("/posts/me",auth,wrap(async(req,res)=>{
  const posts=await pool.query(
    "SELECT * FROM posts WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  )
  res.json(posts.rows)
}))

app.get("/posts",auth,wrap(async(req,res)=>{
  const posts=await pool.query(
    `SELECT p.*, u.username, u.profile_photo FROM posts p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC`
  )
  res.json(posts.rows)
}))

app.post("/posts",auth,upload.single("image"),wrap(async(req,res)=>{
  const caption=req.body.caption
  const image=req.file?.path
  if(!image) return res.status(400).json({error:"image required"})

  const countRes=await pool.query(
    "SELECT COUNT(*) FROM posts WHERE user_id=$1",
    [req.user.id]
  )
  const count=parseInt(countRes.rows[0].count,10)

  const userRes=await pool.query(
    "SELECT vip FROM users WHERE id=$1",
    [req.user.id]
  )
  const vip=userRes.rows[0].vip

  if(!vip && count>=2){
    return res.status(403).json({error:"limit reached for non-VIP users"})
  }

  const newPost=await pool.query(
    "INSERT INTO posts(user_id,image,caption) VALUES($1,$2,$3) RETURNING id",
    [req.user.id,image,caption]
  )
  res.json({postId:newPost.rows[0].id})
}))

// messages endpoint
app.get("/messages",auth,wrap(async(req,res)=>{
  const msgs=await pool.query(
    "SELECT * FROM messages WHERE receiver=$1 OR sender=$1 ORDER BY created_at",
    [req.user.id]
  )
  res.json(msgs.rows)
}))
app.post("/swipe",auth,wrap(async(req,res)=>{

 const {target}=req.body

 await pool.query(
 "INSERT INTO likes(sender,receiver) VALUES($1,$2)",
 [req.user.id,target]
 )

 const match=await pool.query(
 "SELECT * FROM likes WHERE sender=$1 AND receiver=$2",
 [target,req.user.id]
 )

 if(match.rows.length){

 await pool.query(
 "INSERT INTO matches(user1,user2) VALUES($1,$2)",
 [req.user.id,target]
 )

 return res.json({match:true})

 }

 res.json({match:false})

}))

app.post("/upload",auth,upload.single("file"),wrap(async(req,res)=>{

 res.json({file:req.file})

}))

app.post("/payment/webhook",wrap(async(req,res)=>{

 console.log("Payment event",req.body)

 res.sendStatus(200)

}))

app.get("/admin/users",adminAuth,wrap(async(req,res)=>{

 const users=await pool.query(
 "SELECT id,email,first_name,last_name,username,country,verified,vip,anonymous,admin,created_at FROM users"
 )

 res.json(users.rows)

}))

// additional admin endpoints
app.post("/admin/register",upload.single("profilePhoto"),wrap(async(req,res)=>{
  const {email,password,firstName,lastName,username,country,phone}=req.body;
  const profilePhoto=req.file?.path;
  if(!email||!password||!firstName||!lastName||!username||!country||!phone||!profilePhoto){
    return res.status(400).json({error:'all fields required'});
  }
  try {
    const hash=await bcrypt.hash(password,10);
    const user=await pool.query(
      "INSERT INTO users(email,password,first_name,last_name,username,country,phone,profile_photo,admin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING id",
      [email,hash,firstName,lastName,username,country,phone,profilePhoto]
    );
    res.json({userId:user.rows[0].id});
  } catch (error) {
    if (error.code === '23505') { // unique constraint violation
      return res.status(400).json({error: 'Email or username already exists'});
    }
    console.error('Registration error:', error);
    res.status(500).json({error: 'Internal server error'});
  }
}))

app.post("/admin/login",wrap(async(req,res)=>{
  const {email,password}=req.body;
  const user=await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );
  if(!user.rows.length) return res.status(401).json({error:'not found'});
  const u=user.rows[0];
  const valid=await bcrypt.compare(password,u.password);
  if(!valid) return res.status(401).json({error:'invalid password'});
  if(!u.admin) return res.status(403).json({error:'not admin'});
  const token=jwt.sign({id:u.id,admin:true},process.env.JWT_SECRET||"secret");
  res.json({token});
}))

app.get("/admin/stats",adminAuth,wrap(async(req,res)=>{
  const totalUsers=await pool.query("SELECT COUNT(*) FROM users");
  const recent=await pool.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'");
  const totalMatches=await pool.query("SELECT COUNT(*) FROM matches");
  const totalPosts=await pool.query("SELECT COUNT(*) FROM posts");
  const totalMessages=await pool.query("SELECT COUNT(*) FROM messages");
  res.json({
    totalUsers:parseInt(totalUsers.rows[0].count,10),
    recentSignups:parseInt(recent.rows[0].count,10),
    totalMatches:parseInt(totalMatches.rows[0].count,10),
    totalPosts:parseInt(totalPosts.rows[0].count,10),
    totalMessages:parseInt(totalMessages.rows[0].count,10)
  });
}))

app.get("/admin/user/:id",adminAuth,wrap(async(req,res)=>{
  const u=await pool.query("SELECT id,email,first_name,last_name,username,country,verified,vip,anonymous,admin,created_at FROM users WHERE id=$1",[req.params.id]);
  if(!u.rows.length) return res.status(404).json({error:'not found'});
  res.json(u.rows[0]);
}))

app.put("/admin/user/:id",adminAuth,wrap(async(req,res)=>{
  const {verified,vip,anonymous,admin} = req.body;
  await pool.query(
    "UPDATE users SET verified=$1,vip=$2,anonymous=$3,admin=$4 WHERE id=$5",
    [verified,vip,anonymous,admin,req.params.id]
  );
  res.json({message:'updated'});
}))

app.delete("/admin/user/:id",adminAuth,wrap(async(req,res)=>{
  await pool.query("DELETE FROM users WHERE id=$1",[req.params.id]);
  res.json({message:'deleted'});
}))

app.get("/admin/posts",adminAuth,wrap(async(req,res)=>{
  const posts=await pool.query(
    `SELECT p.*, u.username FROM posts p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC`
  );
  res.json(posts.rows);
}))

app.delete("/admin/post/:id",adminAuth,wrap(async(req,res)=>{
  await pool.query("DELETE FROM posts WHERE id=$1",[req.params.id]);
  res.json({message:'deleted'});
}))

app.get("/admin/messages",adminAuth,wrap(async(req,res)=>{
  const msgs=await pool.query(
    `SELECT m.*, su.username AS sender_username, ru.username AS receiver_username
     FROM messages m
     LEFT JOIN users su ON su.id=m.sender
     LEFT JOIN users ru ON ru.id=m.receiver
     ORDER BY m.created_at DESC LIMIT 100`
  );
  res.json(msgs.rows);
}))

// User profile endpoints
app.get("/profile",auth,wrap(async(req,res)=>{
  const user=await pool.query(`
    SELECT u.*, p.bio, p.interests, p.looking_for, p.age_range
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id=$1
  `,[req.user.id]);
  if(!user.rows.length) return res.status(404).json({error:'not found'});
  res.json(user.rows[0]);
}))

app.get("/profile/stats",auth,wrap(async(req,res)=>{
  const userId=req.user.id;
  const matches=await pool.query("SELECT COUNT(*) FROM matches WHERE user1=$1 OR user2=$1",[userId]);
  const likes=await pool.query("SELECT COUNT(*) FROM likes WHERE sender=$1",[userId]);
  const views=await pool.query("SELECT COUNT(*) FROM profile_views WHERE viewed_user=$1",[userId]);
  res.json({
    matches:parseInt(matches.rows[0].count,10),
    likes:parseInt(likes.rows[0].count,10),
    views:parseInt(views.rows[0].count,10)
  });
}))

app.put("/profile",auth,upload.single("profilePhoto"),wrap(async(req,res)=>{
  const userId=req.user.id;
  const {firstName,lastName,username,phone,country,bio,interests,lookingFor,ageRange}=req.body;
  const profilePhoto=req.file?.path;

  const updates=[]
  const values=[]
  let paramCount=1

  if(firstName){updates.push(`first_name=$${paramCount}`);values.push(firstName);paramCount++}
  if(lastName){updates.push(`last_name=$${paramCount}`);values.push(lastName);paramCount++}
  if(username){updates.push(`username=$${paramCount}`);values.push(username);paramCount++}
  if(phone){updates.push(`phone=$${paramCount}`);values.push(phone);paramCount++}
  if(country){updates.push(`country=$${paramCount}`);values.push(country);paramCount++}
  if(profilePhoto){updates.push(`profile_photo=$${paramCount}`);values.push(profilePhoto);paramCount++}

  if(updates.length){
    values.push(userId)
    await pool.query(`UPDATE users SET ${updates.join(',')} WHERE id=$${paramCount}`,values)
  }

  // Update or insert profile details
  const profileData={user_id:userId}
  if(bio) profileData.bio=bio
  if(interests) profileData.interests=interests
  if(lookingFor) profileData.looking_for=lookingFor
  if(ageRange) profileData.age_range=ageRange

  await pool.query(`
    INSERT INTO profiles(user_id,bio,interests,looking_for,age_range)
    VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(user_id) DO UPDATE SET
    bio=EXCLUDED.bio,
    interests=EXCLUDED.interests,
    looking_for=EXCLUDED.looking_for,
    age_range=EXCLUDED.age_range
  `,[userId,bio,interests,lookingFor,ageRange])

  res.json({success:true})
}))

// Dashboard endpoints
app.get("/dashboard/stats",auth,wrap(async(req,res)=>{
  const userId=req.user.id;
  const matches=await pool.query("SELECT COUNT(*) FROM matches WHERE user1=$1 OR user2=$1",[userId]);
  const messages=await pool.query("SELECT COUNT(*) FROM messages WHERE sender=$1 OR receiver=$1",[userId]);
  const likes=await pool.query("SELECT COUNT(*) FROM likes WHERE sender=$1",[userId]);
  res.json({
    matches:parseInt(matches.rows[0].count,10),
    messages:parseInt(messages.rows[0].count,10),
    likes:parseInt(likes.rows[0].count,10)
  });
}))

app.get("/dashboard/activity",auth,wrap(async(req,res)=>{
  const userId=req.user.id;
  // Get recent matches, messages, likes
  const activities=[]
  // This is a simplified version - in real app you'd have an activities table
  res.json(activities)
}))

// Discovery endpoints
app.get("/discover",auth,wrap(async(req,res)=>{
  const userId=req.user.id;
  // Get profiles that user hasn't swiped on yet
  const profiles=await pool.query(`
    SELECT u.id, u.first_name, u.last_name, u.country, u.profile_photo, p.bio
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.id != $1
    AND u.id NOT IN (
      SELECT target FROM swipes WHERE swiper = $1
    )
    LIMIT 20
  `,[userId]);
  res.json(profiles.rows)
}))

app.post("/swipe",auth,wrap(async(req,res)=>{
  const {target,liked}=req.body;
  const swiper=req.user.id;

  await pool.query("INSERT INTO swipes(swiper,target,liked) VALUES($1,$2,$3)",[swiper,target,liked]);

  if(liked){
    // Check for match
    const reciprocal=await pool.query("SELECT * FROM swipes WHERE swiper=$1 AND target=$2 AND liked=true",[target,swiper]);
    if(reciprocal.rows.length>0){
      await pool.query("INSERT INTO matches(user1,user2) VALUES($1,$2)",[swiper,target]);
      res.json({isMatch:true});
    }else{
      res.json({isMatch:false});
    }
  }else{
    res.json({isMatch:false});
  }
}))

app.post("/check-match",auth,wrap(async(req,res)=>{
  const {target}=req.body;
  const user=req.user.id;

  const match=await pool.query("SELECT * FROM matches WHERE (user1=$1 AND user2=$2) OR (user1=$2 AND user2=$1)",[user,target]);
  res.json({isMatch:match.rows.length>0});
}))

// Messaging endpoints
app.get("/conversations",auth,wrap(async(req,res)=>{
  const userId=req.user.id;
  const conversations=await pool.query(`
    SELECT DISTINCT
      u.id, u.first_name, u.last_name, u.profile_photo, u.country,
      m.content as last_message, m.created_at as last_message_time
    FROM users u
    INNER JOIN matches mt ON (mt.user1 = u.id OR mt.user2 = u.id) AND (mt.user1 = $1 OR mt.user2 = $1)
    LEFT JOIN LATERAL (
      SELECT content, created_at
      FROM messages
      WHERE (sender = u.id AND receiver = $1) OR (sender = $1 AND receiver = u.id)
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
    WHERE u.id != $1
    ORDER BY m.created_at DESC NULLS LAST
  `,[userId]);
  res.json(conversations.rows)
}))

app.get("/messages/:userId",auth,wrap(async(req,res)=>{
  const userId=req.user.id;
  const otherUserId=req.params.userId;

  const messages=await pool.query(`
    SELECT id, sender, receiver, content, type, created_at
    FROM messages
    WHERE (sender=$1 AND receiver=$2) OR (sender=$2 AND receiver=$1)
    ORDER BY created_at ASC
  `,[userId,otherUserId]);
  res.json(messages.rows)
}))

app.post("/messages",auth,wrap(async(req,res)=>{
  const {receiver,content}=req.body;
  const sender=req.user.id;

  const message=await pool.query(
    "INSERT INTO messages(sender,receiver,content) VALUES($1,$2,$3) RETURNING *",
    [sender,receiver,content]
  );
  res.json(message.rows[0])
}))

// generic error handler
app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({error:'internal server error'});
});

app.listen(3001,()=>{
 console.log("API running on 3001")
})

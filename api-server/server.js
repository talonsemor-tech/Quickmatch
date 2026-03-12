
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

const upload=multer({dest:"uploads"})

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
 res.json({status:"Quickmatch API running"})
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
 "SELECT * FROM users WHERE email=$1",
 [email]
 )

 if(!user.rows.length) return res.status(401).json({error:"not found"})

 const u=user.rows[0]
 const valid=await bcrypt.compare(password,u.password)

 if(!valid) return res.status(401).json({error:"invalid password"})

 const token=jwt.sign(
 {id:u.id, admin: u.admin || false},
 process.env.JWT_SECRET || "secret"
 )

 res.json({token})

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
  const hash=await bcrypt.hash(password,10);
  const user=await pool.query(
    "INSERT INTO users(email,password,first_name,last_name,username,country,phone,profile_photo,admin) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING id",
    [email,hash,firstName,lastName,username,country,phone,profilePhoto]
  );
  res.json({userId:user.rows[0].id});
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

// generic error handler
app.use((err,req,res,next)=>{
  console.error(err);
  res.status(500).json({error:'internal server error'});
});

app.listen(3001,()=>{
 console.log("API running on 3001")
})

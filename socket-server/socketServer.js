
const {Server}=require("socket.io")
const jwt=require("jsonwebtoken")
const {Pool}=require("pg")

// log unhandled errors so server doesn’t crash silently
process.on('uncaughtException', (err)=>{
  console.error('uncaughtException', err)
})
process.on('unhandledRejection', (reason)=>{
  console.error('unhandledRejection', reason)
})

const pool=new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://quickmatch:quickmatch@localhost:5432/quickmatch"
})

const io=new Server(4000,{
 cors:{origin:"*"},
 // allow auth token via handshake
})

io.use((socket,next)=>{
  const token=socket.handshake.auth?.token
  if(!token) return next(new Error("no token"))
  try{
    const user=jwt.verify(token,process.env.JWT_SECRET||"secret")
    socket.userId=user.id
    next()
  }catch(e){
    next(new Error("invalid token"))
  }
})

io.on("connection",(socket)=>{

 console.log("user connected",socket.id, socket.userId)
 // automatically join personal room
 if(socket.userId) socket.join(socket.userId.toString())

 socket.on("join",(user)=>{
  socket.join(user)
 })

io.on("connection",(socket)=>{

 console.log("user connected",socket.id, socket.userId)
 // automatically join personal room
 if(socket.userId) socket.join(socket.userId.toString())

 socket.on("join",(user)=>{
  socket.join(user)
 })

 socket.on("send_message",async(data)=>{
  try{
    // Store message in DB
    const result = await pool.query(
      "INSERT INTO messages(sender,receiver,content,type) VALUES($1,$2,$3,$4) RETURNING *",
      [socket.userId, data.to, data.message, 'text']
    )

    const message = result.rows[0];

    // Send to recipient
    io.to(data.to.toString()).emit("message", {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      type: message.type,
      created_at: message.created_at
    });

    // Also send back to sender for confirmation
    socket.emit("message", {
      id: message.id,
      sender: message.sender,
      receiver: message.receiver,
      content: message.content,
      type: message.type,
      created_at: message.created_at
    });

  }catch(e){
    console.error('Message store error:', e);
    socket.emit("message_error", { error: "Failed to send message" });
  }
 });

 socket.on("typing", (data) => {
  // Broadcast typing status to the other user
  socket.to(data.userId.toString()).emit("typing", {
   userId: socket.userId,
   isTyping: data.isTyping
  });
 });

 socket.on("disconnect",()=>{
  console.log("user disconnected", socket.userId)
 })

})

 socket.on("disconnect",()=>{
  console.log("user disconnected", socket.userId)
 })

})

console.log("Socket server running on 4000")

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./src/config/db.js";
import cookieParser from "cookie-parser";

//scheduling
import "./src/utils/cron.js";


// routes
import authRoute from "./src/routes/authRoutes.js";
import recordRoute from "./src/routes/recordRoute.js";
import dashboardRoutes from "./src/routes/dashboardRoute.js";
import adminRoute from "./src/routes/adminRoute.js";
import analystRoute from "./src/routes/analystRoute.js";
import userRoute from "./src/routes/userRoute.js";

import { limiter } from "./src/utils/limiter.js";

dotenv.config();
connectDB();

const app=express();

app.use(cors({
    origin:process.env.FRONTEND_URL,  //normally added placed for future when we will have frontend and backend on different domains
    credentials:true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(limiter);


//routes
app.use("/api/auth",authRoute);
app.use("/api/record",recordRoute);
app.use("/api/dashboard",dashboardRoutes);
app.use("/api/admin",adminRoute);
app.use("/api/analyst",analystRoute);
app.use("/api/user",userRoute);


app.get("/",(req,res)=>{
    res.send("Finance API Running...");
});

const PORT=process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})


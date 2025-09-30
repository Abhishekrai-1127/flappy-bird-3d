import mongoose from "mongoose";

let isconnected = false;
export const connectToDB = async () => {
    if (isconnected) return;
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "flappy-bird-cluster",
            useNewUrlParser: true,
            useunifiedTopology: true,
        });
        isconnected = true;
        console.log("MongoDB connected");
    }
    catch(err){
        console.log("MongoDB not Connected",err);
    }
}
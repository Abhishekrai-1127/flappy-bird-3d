import mongoose from "mongoose";

const ScoreSchema = new mongoose.Schema({

    name: { type: String },
    score: { type: Number },
    createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.score || mongoose.model("Score", ScoreSchema);
import { connectToDB } from "../../lib/mongodb";
import score from "../../models/Score";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { id, currScore } = await request.json();

        if (id == "" || currScore == null) {
            return new Response(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        await connectToDB();
        const newScore = await score.findByIdAndUpdate(
            id,
            { score: currScore },
            { new: true, upsert: true }
        );



        return new Response(
            JSON.stringify({ message: "Score Updated", data: newScore }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}

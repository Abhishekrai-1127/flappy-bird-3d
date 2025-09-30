import { connectToDB } from "../../lib/mongodb";
import Score from "../../models/Score";

export async function GET() {
  try {
    await connectToDB();

    // Fetching all scores in descending order
    const allScores = await Score.find({})
      .sort({ score: -1 }); // Sort by score descending

    // Map results
    const formattedScores = allScores.map((item) => ({
      _id: item._id.toString(),
      name: item.name || "Unknown",
      score: item.score || 0,
      createdAt: item.createdAt,
    }));

    return new Response(JSON.stringify(formattedScores), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

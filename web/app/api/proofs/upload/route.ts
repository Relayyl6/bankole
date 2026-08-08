import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const milestoneId = formData.get("milestoneId") as string;
    const geoTag = formData.get("geoTag") as string;
    const timestamp = formData.get("timestamp") as string;
    const files = formData.getAll("files") as File[];
    const captions = formData.getAll("captions") as string[];

    if (!milestoneId || files.length === 0) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // In production: upload to cloud storage (S3/GCS/Cloudinary) and save refs to DB.
    // For now, we simulate processing and return mock proof records.
    const proofRecords = files.map((file, i) => ({
      id: `proof-${Date.now()}-${i}`,
      milestoneId,
      filename: file.name,
      size: file.size,
      type: file.type,
      caption: captions[i] || file.name,
      geoTag,
      timestamp,
      status: "pending_review",
      locationVerified: geoTag !== "Not captured",
    }));

    // Simulate a small processing delay
    await new Promise((r) => setTimeout(r, 500));

    return NextResponse.json({
      success: true,
      proofs: proofRecords,
      message: `${files.length} proof(s) submitted successfully.`,
    });
  } catch (err: any) {
    console.error("[proof-upload]", err);
    return NextResponse.json({ message: "Server error during upload." }, { status: 500 });
  }
}

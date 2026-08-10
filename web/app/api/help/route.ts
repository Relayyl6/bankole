import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In a real application, you would send this to Zendesk, Jira, Discord, etc.
    // For now, we'll just acknowledge the receipt.
    console.log("Support Ticket Received:", body);

    return NextResponse.json(
      { success: true, message: "Ticket submitted successfully! We'll be in touch soon.", ticketId: `#BK-${Math.floor(Math.random() * 10000)}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing help ticket:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit ticket. Please try again later." },
      { status: 500 }
    );
  }
}

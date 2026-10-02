import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Expire the admin cookie immediately
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return response;
}

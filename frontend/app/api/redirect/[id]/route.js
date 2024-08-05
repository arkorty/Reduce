import { NextResponse } from "next/server";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function GET(request, { params }) {
  const { id } = params;

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/${id}`,
    );
    if (response.status === 200) {
      return NextResponse.redirect(response.data.long_url);
    } else {
      return new NextResponse("URL not found", { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Server error", { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE_URL = "https://api.mangadex.org";

export async function GET(request: NextRequest) {
  try {
    // Get the path and query parameters from the request
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "";

    // Remove 'path' from searchParams to forward the rest to MangaDex
    searchParams.delete("path");

    // Construct the URL to forward to MangaDex
    const url = new URL(`${MANGADEX_BASE_URL}/${path}`);

    // Add the remaining search params to the URL
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    console.log(`Proxying request to: ${url.toString()}`);

    // Make the request to MangaDex
    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "KenRead/1.0", // Identify your app to the API
      },
    });

    if (!response.ok) {
      throw new Error(
        `MangaDex API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Return the data
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in MangaDex API proxy:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the path from the query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "";

    // Remove 'path' from searchParams
    searchParams.delete("path");

    // Construct the URL
    const url = new URL(`${MANGADEX_BASE_URL}/${path}`);

    // Add remaining search params
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Get the body from the request
    const body = await request.json();

    // Make the request to MangaDex
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "KenRead/1.0",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `MangaDex API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in MangaDex API proxy:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

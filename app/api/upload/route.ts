import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Ensure upload directories exist
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');

// Create directories if they don't exist
[UPLOADS_DIR, IMAGES_DIR, DOCUMENTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Check file type and size
    const isImage = file.type.startsWith('image/');
    const isDocument = file.type === 'application/pdf' || 
                       file.type === 'application/msword' ||
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (!isImage && !isDocument) {
      return new NextResponse("Invalid file type. Only images and documents are allowed.", { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return new NextResponse("File too large. Maximum size is 10MB.", { status: 400 });
    }

    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${randomUUID()}.${fileExtension}`;
    
    // Determine directory based on file type
    const targetDir = isImage ? IMAGES_DIR : DOCUMENTS_DIR;
    const filePath = path.join(targetDir, fileName);
    
    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    
    // Generate the URL to access the file
    const fileUrl = `/uploads/${isImage ? 'images' : 'documents'}/${fileName}`;
    
    // Return the URL of the uploaded file
    return NextResponse.json({ 
      url: fileUrl,
      filename: fileName
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 
import clientPromise from '../../mongodb';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import { Readable } from 'stream';
import fs from 'fs'; // Import file system module to read the file

export const config = {
  api: {
    bodyParser: false,
  },
};

cloudinary.config({
  secure: true,
});

function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request) {
  try {
    const buffer = Buffer.from(await request.arrayBuffer());
    const reqStream = bufferToStream(buffer);

    // Formidable requires these properties on the stream to parse correctly in some environments
    reqStream.headers = {};
    request.headers.forEach((value, key) => {
      reqStream.headers[key] = value;
    });
    reqStream.method = request.method;
    console.log('DEBUG (edit_profile): Request stream prepared for formidable parsing.');

    const data = await new Promise((resolve, reject) => {
      // formidable expects the actual request object or a compatible stream with headers
      // Since we're reconstructing it from arrayBuffer, ensure it's compatible.
      // For Next.js App Router, direct parsing of `request` might be simpler if not for the custom buffer conversion.
      // Let's stick to your buffer-to-stream method for now, ensuring it mimics a standard request well.

      const form = formidable({ multiples: false }); // maxFiles: 1 for single photo

      form.parse(reqStream, (err, fields, files) => {
        if (err) {
          console.error('DEBUG (edit_profile): Error parsing form data:', err);
          return reject(err);
        }
        console.log('DEBUG (edit_profile): Formidable parsing complete. Fields:', fields);
        console.log('DEBUG (edit_profile): Formidable parsing complete. Files:', files);

        // Formidable returns arrays for fields/files even if multiples is false, so get the first element
        const processedFields = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
        );
        const processedFiles = Object.fromEntries(
            Object.entries(files).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
        );

        resolve({ fields: processedFields, files: processedFiles });
      });
    });

    const username = data.fields.username;
    const name = data.fields.name;
    const bio = data.fields.bio;
    const photoFile = data.files?.photo; // formidable file object

    if (!username) {
        console.error('DEBUG (edit_profile): Username is missing.');
        return NextResponse.json({ success: false, message: 'Username is required.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('DP_MESSAGING');

    // Find the user first (case-sensitive check on field name)
    console.log('DEBUG (edit_profile): Fetching user from database for username:', username);
    const user = await db.collection('CREDENTIALS').findOne({ 'USERNAME': username }); // Ensure this matches your DB field name

    if (!user) {
      console.error('DEBUG (edit_profile): User not found for username:', username);
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let photoUrl = user.photo; // Keep existing photo if no new one is uploaded

    if (photoFile) {
        try {
            // Ensure photoFile.filepath exists and is readable
            if (!photoFile.filepath) {
                console.error('DEBUG (edit_profile): photoFile.filepath is missing.');
                return NextResponse.json({ success: false, message: 'Photo file path is missing.' }, { status: 400 });
            }

            // Upload the file stream to Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { 
                      folder: 'profile_photos',
                      public_id: username
                    }, 
                    (error, result) => {
                        if (error) {
                            console.error('DEBUG (edit_profile): Cloudinary upload error:', error);
                            return reject(error);
                        }
                        resolve(result);
                    }
                );
                // Read the file from its temporary path and pipe it to Cloudinary upload stream
                fs.createReadStream(photoFile.filepath).pipe(uploadStream);
            });
            photoUrl = uploadResult.secure_url;
            console.log('DEBUG (edit_profile): Photo uploaded to Cloudinary:', photoUrl);
        } catch (uploadError) {
            console.error('DEBUG (edit_profile): Failed to upload photo to Cloudinary:', uploadError);
            return NextResponse.json({ success: false, message: 'Failed to upload profile picture.' }, { status: 500 });
        }
    }

    // Prepare update document
    const updateDoc = {
      $set: {
        NAME: name,
        BIO: bio,
      }
    };

    // Only add photo field if it's explicitly updated
    if (photoFile || (photoFile === null && user.photo)) { // Allow explicitly setting photo to null/undefined if that's a client intent
        updateDoc.$set.PHOTO = photoUrl;
    }


    const updateResult = await db.collection('CREDENTIALS').updateOne(
      { 'USERNAME': username }, // Use the consistent field name
      updateDoc
    );

    if (updateResult.modifiedCount === 1) {
      console.log('DEBUG (edit_profile): User profile updated successfully for username:', username);
      return NextResponse.json({ success: true, message: 'Profile updated successfully', photoUrl: photoUrl });
    } else {
      console.log('DEBUG (edit_profile): User profile not modified or no changes for username:', username);
      // This could happen if the submitted data is identical to existing data
      return NextResponse.json({ success: true, message: 'Profile data unchanged or already up to date.' });
    }

  } catch (error) {
    console.error('DEBUG (edit_profile): Caught unhandled error during profile update:', error);
    return NextResponse.json({ success: false, message: 'An internal server error occurred.' }, { status: 500 });
  }
}   

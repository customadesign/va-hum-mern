const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const bucketName = process.env.SUPABASE_BUCKET || "linkage-va-hub";

console.log("🔍 Debugging Supabase Upload...");
console.log("URL:", supabaseUrl);
console.log("Bucket:", bucketName);
console.log("Key configured:", !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    // 1. List existing buckets
    console.log("\n1. Checking existing buckets...");
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Error listing buckets:", listError);
      return;
    }

    console.log(
      "Available buckets:",
      buckets.map((b) => b.name)
    );

    // 2. Check if our bucket exists
    const bucketExists = buckets.some((bucket) => bucket.name === bucketName);
    console.log(`Bucket '${bucketName}' exists:`, bucketExists);

    if (!bucketExists) {
      console.error("❌ Bucket does not exist!");
      return;
    }

    // 3. List files in bucket
    console.log("\n2. Listing files in bucket...");
    const { data: files, error: filesError } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 100 });

    if (filesError) {
      console.error("❌ Error listing files:", filesError);
    } else {
      console.log(
        "Files in bucket:",
        files.map((f) => f.name)
      );
    }

    // 4. Test upload
    console.log("\n3. Testing upload...");
    const testContent = `Test file created at ${new Date().toISOString()}`;
    const testFileName = `test-upload-${Date.now()}.txt`;

    console.log("Uploading file:", testFileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testContent, {
        contentType: "text/plain",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Upload failed:", uploadError);
      console.error("Error details:", {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
      });
    } else {
      console.log("✅ Upload successful!");
      console.log("Upload data:", uploadData);

      // 5. Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(testFileName);

      console.log("Public URL:", publicUrl);

      // 6. Test download
      console.log("\n4. Testing download...");
      const { data: downloadData, error: downloadError } =
        await supabase.storage.from(bucketName).download(testFileName);

      if (downloadError) {
        console.error("❌ Download failed:", downloadError);
      } else {
        console.log("✅ Download successful!");
        console.log("File size:", downloadData.size, "bytes");
      }

      // 7. List files again to confirm
      console.log("\n5. Listing files after upload...");
      const { data: filesAfter, error: filesAfterError } =
        await supabase.storage.from(bucketName).list("", { limit: 100 });

      if (filesAfterError) {
        console.error("❌ Error listing files after upload:", filesAfterError);
      } else {
        console.log(
          "Files after upload:",
          filesAfter.map((f) => f.name)
        );
        const newFile = filesAfter.find((f) => f.name === testFileName);
        if (newFile) {
          console.log("✅ New file found in bucket!");
          console.log("File details:", newFile);
        } else {
          console.log("❌ New file not found in bucket listing");
        }
      }
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testUpload();

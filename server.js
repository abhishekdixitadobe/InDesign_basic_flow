const express = require("express");
const bodyParser = require("body-parser");
const csv = require("csv-parser");
const app = express();
const port = 3000;
const path = require("path");
const request = require("request");
require("dotenv").config();
const cors = require("cors");
const { Readable } = require("stream");
const axios = require("axios");
const fs = require("fs");
// Define the storage for uploaded files
const multer = require("multer");
var AWS = require("aws-sdk");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 })
);
const upload = multer({ dest: "uploads/" }); 
// SSL
const https = require("https");

const INDESIGN_BASE_URL = process.env.INDESIGN_BASE_URL;
const INDESIGN_SCOPE = process.env.INDESIGN_SCOPE;
const ADOBE_API_KEY = process.env.API_KEY; 
const ADOBE_CLIENT_SECRET = process.env.ADOBE_CLIENT_SECRET;
const IMS_ORG_ID = process.env.ADOBE_IMS_ORG_ID;
const IMS_URL = process.env.IMS_URL;
const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const STORAGE_TYPE = process.env.STORAGE_TYPE || "AWS";

const AZURE_STORAGE_URL = process.env.AZURE_STORAGE_URL;
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER;
const AZURE_STORAGE_SAS = process.env.AZURE_STORAGE_SAS;


const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});



const storage = multer.memoryStorage(); // Use in-memory storage
// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const STATIC_ASSETS_PATH = path.resolve(__dirname, "../static");

app.use(express.static(STATIC_ASSETS_PATH));


// Swagger UI
const swaggerDocs = require("./server/config/swaggerConfig");
const swaggerUI = require("swagger-ui-express");
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));



// logging
const { log, clearLog } = require("./server/logging/logger");
const logRoute = require("./server/logging/logRoute");
app.use(logRoute);

// Middleware to add a logger to the request object
app.use((req, res, next) => {
  const sessionId = req.sessionID;
  req.logger = {
    log: (level, message) => {
      log(sessionId, level, message);
    },
    clear: () => {
      clearLog(sessionId);
    },
  };
  next();
});

// get sessionID
app.get("/api/session", (req, res) => {
  req.logger.log("info", "Initializing...");
  res.send({ sessionID: req.sessionID });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(STATIC_ASSETS_PATH, "index.html"));
});

const dataMergeOutputOptions = [
  { label: "JPEG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "Indesign file", value: "application/x-indesign" },
  { label: "PDF", value: "application/pdf" },
];
const renditionOutputOptions = [
  { label: "JPEG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "PDF", value: "application/pdf" },
];

/**
 * Generate a presigned URL for uploading a file
 * @param {string} key - S3 object key (path/filename)
 * @param {string} contentType - MIME type of file
 * @param {number} expiresIn - URL expiry in seconds
 */
async function generateUploadURL(key, contentType, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadURL = await getSignedUrl(s3, command, { expiresIn });
  return uploadURL;
}

/**
 * Generate a presigned URL for downloading a file
 * @param {string} key - S3 object key (path/filename)
 * @param {number} expiresIn - URL expiry in seconds
 */
async function generateDownloadURL(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const downloadURL = await getSignedUrl(s3, command, { expiresIn });
  return downloadURL;
}


async function generateFireFlyIMSToken() {
  console.log("inside generateFireFlyIMSToken::");
  const options = {
    method: 'POST',
    url: IMS_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      grant_type: 'client_credentials',
      client_id: ADOBE_API_KEY,
      client_secret: ADOBE_CLIENT_SECRET,
      scope: INDESIGN_SCOPE
    }
  };

  return new Promise((resolve, reject) => {
    request(options, (err, res, body) => {
      if(err || res.statusCode >= 400) {
        reject( err || body )
      }else{
        resolve( body )
      }
    })
  })
}
function buildOperationPayload(fileURLs, options = {}) {
  const {
    storageType = options.storageType || "AWS", // 'AWS' or 'Azure'
    destinationBase = "", 
    targetDocument = options.targetDocument || "", 
    outputMediaType = options.outputMediaType || "image/jpeg",
    convertUrlToHyperlink = options.convertUrlToHyperlink ?? true,
    outputFileBaseString =
      options.outputFileBaseString ||
      "output",
    generalSettings = options.generalSettings || {},
  } = options;

  // Normalize destination: if destinationBase provided, append filename
  const assets = fileURLs.map((url) => {
    // try to extract filename from URL
    let filename;
    try {
      const parsed = new URL(url);
      filename = decodeURIComponent(parsed.pathname.split("/").pop());
    } catch (e) {
      // fallback: take last segment after slash
      filename = url.split("/").pop();
    }

    const destination =
      destinationBase && destinationBase.length
        ? `${destinationBase.replace(/\/+$/,"")}/${filename}`
        : filename;

    return {
      source: {
        url
      },
      destination,
    };
  });
  const stripQuery = (u) => u.split("?")[0].toLowerCase();

  // Identify .indd and .csv files from URLs
  const targetDocAsset = assets.find((a) => stripQuery(a.source.url).endsWith(".indd"));
  const dataSourceAsset = assets.find((a) => stripQuery(a.source.url).endsWith(".csv"));

  const payload = {
    assets,
    params: {
      generalSettings,
      targetDocument: targetDocAsset ? targetDocAsset.destination : "",
      dataSource: dataSourceAsset ? dataSourceAsset.destination : "",
      outputMediaType,
      convertUrlToHyperlink,
      outputFileBaseString,
    }
  };

  return payload;
}

async function makeCallToInDesign(payload, operation) {
   console.log(`Calling InDesign for operation: ${operation}`);

    let fireflyAuthDetails = await generateFireFlyIMSToken();
    let fireFlyCreds = JSON.parse(fireflyAuthDetails);

    // Step 1: Trigger Data Merge job
    const endpoint = INDESIGN_BASE_URL + "/" + (operation === "data-merge" ? "merge-data" : "create-rendition");
    const postResponse = await axios.post(
      endpoint,
      payload,
      { headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${fireFlyCreds.access_token}`,
        "x-api-key": ADOBE_API_KEY,
        "x-gw-ims-org-id": IMS_ORG_ID,
       } }
    );

    const { jobId, statusUrl } = postResponse.data;
    console.log(`Job triggered: ${jobId}`);

    // Step 2: Poll until job completes
    let jobStatus = "pending";
    let finalResult = null;
    const maxAttempts = 10;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Checking job status (Attempt ${i + 1})...`);

      const statusResponse = await axios.get(statusUrl, {
        headers: {
          Authorization: `Bearer ${fireFlyCreds.access_token}`,
          "x-api-key": ADOBE_API_KEY,
          "x-gw-ims-org-id": IMS_ORG_ID,
        },
      });

      jobStatus = statusResponse.data.status;

      if (jobStatus === "succeeded" || jobStatus === "failed") {
        finalResult = statusResponse.data;
        break;
      }

      await delay(3000); // wait 3s before next check
    }

    if (!finalResult) {
      return res.status(202).json({
        message: "Job still processing — try again later",
        jobId,
        statusUrl,
      });
    }

  return finalResult;
}

app.post("/middleware/upload-and-process", upload.array("files"), async (req, res) => {
  try {
    const { action, operation } = req.body;

    const uploadedFiles = req.files; // array of file objects

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      console.log(`Received ${uploadedFiles.length} files`);

      let presignedUploads = [];

      if(STORAGE_TYPE == "AWS") {
        // STEP 1: Generate presigned upload URLs for all files
        presignedUploads = await Promise.all(
          uploadedFiles.map(async (file) => {
            const uploadUrl = await generateUploadURL(file.originalname, file.mimetype);
            return { file, uploadUrl };
          })
        );

        // STEP 2: Upload each file to S3 using the presigned URL
        await Promise.all(
          presignedUploads.map(async ({ file, uploadUrl }) => {
            const fileData = fs.readFileSync(file.path);
            await axios.put(uploadUrl, fileData, { headers: { "Content-Type": file.mimetype } });
            fs.unlinkSync(file.path);
          })
        );

        console.log("All files uploaded to S3");
    }else{
        // Azure Blob Storage upload
        presignedUploads = await Promise.all(
          uploadedFiles.map(async (file) => {
            // Construct Blob URL with SAS token
            const blobUrl = `${AZURE_STORAGE_URL}/${AZURE_STORAGE_CONTAINER}/${file.originalname}?${AZURE_STORAGE_SAS}`;
            return { file, blobUrl };
          })
        );  
        // STEP 2: Upload each file to Azure Blob Storage
        await Promise.all(
          presignedUploads.map(async ({ file, blobUrl }) => {
              const fileData = fs.readFileSync(file.path);
              await axios.put(blobUrl, fileData, { headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": file.mimetype } });
              fs.unlinkSync(file.path)
          })
        );
        console.log("All files uploaded to Azure Blob Storage");
    }

      // STEP 3: Create list of uploaded file URLs (S3 paths)
      const uploadedFileURLs = await Promise.all(
        presignedUploads.map(async ({ file }) => await generateDownloadURL(file.originalname))
      );

      const selectedOutput = dataMergeOutputOptions.find(
        (opt) => opt.label.toLowerCase() === action.toLowerCase()
      );
      const outputMediaType = selectedOutput
        ? selectedOutput.value
        : "image/jpeg";

      const payload = buildOperationPayload(uploadedFileURLs,{
        storageType: STORAGE_TYPE,
        destinationBase: "", // optional prefix
        targetDocument: "",
        outputMediaType: outputMediaType,
        convertUrlToHyperlink: true,
        outputFileBaseString: "derived-from-original-name",
        generalSettings: { locale: "en-IN" }
      });
      
      const middlewareResponse = await makeCallToInDesign(payload, operation);

      const resultURLs = middlewareResponse.outputs.map((o) => o.destination.url);
      res.json({ resultURLs });
      //res.status(200).json(finalResult);
  } catch (err) {
    console.error("InDesign job failed:", err.message);
    res.status(500).json({
      error: "Failed to call InDesign Data Merge API",
      details: err.message,
    });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Middleware running on port ${PORT}`));
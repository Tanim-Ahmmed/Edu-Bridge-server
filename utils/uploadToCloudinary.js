const path = require("path");
const cloudinary = require("../config/cloudinary");

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const uploadToCloudinary = async (file) => {
  if (!file) {
    throw new Error("File is required for upload.");
  }

  const isImage = imageMimeTypes.has(file.mimetype);
  const resourceType = isImage ? "image" : "raw";
  const publicId = `${Date.now()}-${path.parse(file.originalname).name}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve({
          url: result.secure_url,
          type: file.mimetype,
        });
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = uploadToCloudinary;

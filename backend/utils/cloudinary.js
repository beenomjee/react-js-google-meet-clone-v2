import cloudinary from "cloudinary";

const v2 = cloudinary.v2;

export const uploadImage = async (base64Img, folderName) => {
  v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });
  const { secure_url } = await v2.uploader.upload(base64Img, {
    resource_type: "image",
    folder: folderName,
  });
  return secure_url;
};

export const deleteImage = async (imgUrl, folderName) => {
  v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });
  const publicId = imgUrl
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "");

  await v2.uploader.destroy(folderName + "/" + publicId);
};

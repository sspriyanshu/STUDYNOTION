const cloudinary = require('cloudinary').v2

exports.uploadImageToCloudinary = async (file, folder, height, width) => {
    const options = { folder };

    if (height) options.height = height;
    if (width) options.width = width;

    options.crop = "fill"; // resize properly
    options.resource_type = "auto";

    return await cloudinary.uploader.upload(file.tempFilePath, options);
};

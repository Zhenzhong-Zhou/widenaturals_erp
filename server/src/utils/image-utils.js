const sharp = require('sharp');

/**
 * Resize a local image to the given width and output to WebP format.
 * @param {string} sourcePath - Path to the original image
 * @param {string} targetPath - Output path for resized image
 * @param {number} width - Target width in pixels
 * @param {number} quality - Compression quality (1–100)
 * @param {number} effort - Compression effort (0–6)
 * @returns {Promise<void>}
 */
const resizeImage = async (sourcePath, targetPath, width, quality = 80, effort = 5) => {
  await sharp(sourcePath)
    .resize({ width })
    .webp( {quality, effort})
    .toFile(targetPath);
}

module.exports = {
  resizeImage,
};

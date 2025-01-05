const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/awsS3Config');

// Upload file to S3
const uploadToS3 = async ({ bucketName, folder, fileName, fileBuffer, contentType }) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: `${folder}/${fileName}`,
      Body: fileBuffer,
      ContentType: contentType,
    };
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    
    // Return the S3 file URL
    return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${folder}/${fileName}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

module.exports = { uploadToS3 };

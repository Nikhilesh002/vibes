export const supportedVideoFormats = [
  'video/mp4',
  'video/x-msvideo', // AVI
  'video/x-flv', // FLV
  'video/x-matroska', // MKV
  'video/ogg', // OGV
  'video/webm', // WEBM
  'video/3gpp', // 3GP
  'video/3gpp2', // 3G2
];

export const supportedImageFormats = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'image/svg+xml',
  'image/heic',
];

export const supportedFormats = {
  video: supportedVideoFormats,
  image: supportedImageFormats,
};

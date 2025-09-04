export const buildBlobName = (file: File) => {
  const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');

  const lastDotIdx = fileName.lastIndexOf('.');
  const filename = fileName.substring(0, lastDotIdx);
  const ext = fileName.substring(lastDotIdx);
  return filename + '_' + Math.random().toString(16).slice(2) + ext;
  // return file.name;
};

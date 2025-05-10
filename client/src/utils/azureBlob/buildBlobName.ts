export const buildBlobName = (file: File) => {
  const lastDotIdx = file.name.lastIndexOf(".");
  const filename = file.name.substring(0, lastDotIdx);
  const ext = file.name.substring(lastDotIdx);
  return filename + "_" + Math.random().toString(16).slice(2) + ext;
  // return file.name;
};

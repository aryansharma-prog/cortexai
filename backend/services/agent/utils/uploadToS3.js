import { saveFileAndGetUrl } from "./fileStorage.js";

export const uploadToS3 = async (filename, buffer, contentType) => {
  return await saveFileAndGetUrl(filename, buffer, contentType);
};
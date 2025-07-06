/**
 * Converts a File object to a base64 encoded string, stripping the data URL prefix.
 * @param file The File object to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result is in the format "data:[<mime-type>];base64,<base64-string>"
      // We need to extract just the base64 part.
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read base64 string from file."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converts a File object to a base64 encoded data URL string.
 * @param file The File object to convert.
 * @returns A promise that resolves with the data URL string (e.g., "data:image/png;base64,...").
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
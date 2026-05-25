/**
 * Video / image generation via gateway (async job + polling).
 */

import {
  runJsonGeneration,
  runMultipartGeneration,
} from "./generationService";

export const generateVideo = async (prompt, mode = "image", options = {}) => {
  return runJsonGeneration(
    { prompt, mode, image_url: options.image_url },
    { onProgress: options.onProgress }
  );
};

export const generateWithFormData = async (formData, pollOptions) => {
  return runMultipartGeneration(formData, pollOptions);
};

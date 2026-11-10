/* Put this file at app/twitter-image.tsx (same picture for X / Twitter cards) */
import OpengraphImage from "./opengraph-image";

export const alt = "IWAHH, small-batch perfume house";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return OpengraphImage();
}

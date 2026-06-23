import { config } from "dotenv";

config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const MONGO_URI = process.env.MONGO_URI as string;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const FEATURE_SOCIFICATION = process.env.FEATURE_SOCIFICATION === "true";
export const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || "socitune_internal_secret_token_123!";
export const SOCIFICATION_SERVICE_URL = process.env.SOCIFICATION_SERVICE_URL || "https://socification.onrender.com";

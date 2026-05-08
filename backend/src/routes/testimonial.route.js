import { Router } from "express";
import { createTestimonial, deleteTestimonial, getTestimonials } from "../controller/testimonial.controller.js";
import { protectRoute, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", getTestimonials);
router.post("/", protectRoute, createTestimonial);
router.delete("/:id", protectRoute, requireAdmin, deleteTestimonial);

export default router;

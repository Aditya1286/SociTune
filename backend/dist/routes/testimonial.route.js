import { Router } from "express";
import TestimonialController from "../controllers/testimonial.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";
class TestimonialRoutes {
    path = '/api/testimonials';
    router = Router();
    testimonialController = Singleton.instance(TestimonialController);
    authMiddleware = Singleton.instance(AuthMiddleware);
    constructor() {
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get(`${this.path}/`, asyncHandler(this.testimonialController.getTestimonials));
        this.router.post(`${this.path}/`, this.authMiddleware.protectRoute, asyncHandler(this.testimonialController.createTestimonial));
        this.router.delete(`${this.path}/:id`, this.authMiddleware.protectRoute, this.authMiddleware.requireAdmin, asyncHandler(this.testimonialController.deleteTestimonial));
    }
}
export default TestimonialRoutes;

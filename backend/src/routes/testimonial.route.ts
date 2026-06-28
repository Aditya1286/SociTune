import { Router } from "express";
import { Routes } from "../typings/routes.js";
import TestimonialController from "../controllers/testimonial.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class TestimonialRoutes implements Routes {
    public path = '/api/testimonials';
    public router = Router();
    public testimonialController = Singleton.instance<TestimonialController>(TestimonialController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            `${this.path}/`,
            asyncHandler(this.testimonialController.getTestimonials)
        );
        this.router.post(
            `${this.path}/`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.testimonialController.createTestimonial)
        );

    }
}

export default TestimonialRoutes;

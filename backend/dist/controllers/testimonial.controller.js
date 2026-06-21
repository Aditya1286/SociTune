import { Testimonial } from "../models/testimonial.model.js";
import { User } from "../models/user.model.js";
class TestimonialController {
    async createTestimonial(req, res, next) {
        try {
            const { rating, content } = req.body;
            const userId = req.auth.userId;
            if (!rating || !content) {
                return res.status(400).json({ message: "Rating and content are required" });
            }
            const testimonial = new Testimonial({
                userId,
                rating,
                content,
            });
            await testimonial.save();
            res.status(201).json(testimonial);
        }
        catch (error) {
            next(error);
        }
    }
    async getTestimonials(req, res, next) {
        try {
            const testimonials = await Testimonial.find().sort({ createdAt: -1 });
            // Optimize N+1 query: Fetch all unique users in a single query
            const userIds = [...new Set(testimonials.map(t => t.userId))];
            const users = await User.find({ clerkId: { $in: userIds } }).select("clerkId fullName imageUrl");
            const userMap = users.reduce((acc, user) => {
                acc[user.clerkId] = { fullName: user.fullName, imageUrl: user.imageUrl };
                return acc;
            }, {});
            const populatedTestimonials = testimonials.map((t) => ({
                ...t.toObject(),
                user: userMap[t.userId] || null
            }));
            res.status(200).json(populatedTestimonials);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTestimonial(req, res, next) {
        try {
            const { id } = req.params;
            await Testimonial.findByIdAndDelete(id);
            res.status(200).json({ message: "Testimonial deleted successfully" });
        }
        catch (error) {
            next(error);
        }
    }
}
export default TestimonialController;

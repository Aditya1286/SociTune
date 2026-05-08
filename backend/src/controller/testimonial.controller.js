import { Testimonial } from "../models/testimonial.model.js";
import { User } from "../models/user.model.js";

export const createTestimonial = async (req, res, next) => {
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
	} catch (error) {
		next(error);
	}
};

export const getTestimonials = async (req, res, next) => {
	try {
		const testimonials = await Testimonial.find().sort({ createdAt: -1 });
		
		// Manually populate user data since we use clerkId string ref
		const populatedTestimonials = await Promise.all(
			testimonials.map(async (t) => {
				const user = await User.findOne({ clerkId: t.userId });
				return {
					...t.toObject(),
					user: user ? { fullName: user.fullName, imageUrl: user.imageUrl } : null
				};
			})
		);

		res.status(200).json(populatedTestimonials);
	} catch (error) {
		next(error);
	}
};

export const deleteTestimonial = async (req, res, next) => {
	try {
		const { id } = req.params;
		await Testimonial.findByIdAndDelete(id);
		res.status(200).json({ message: "Testimonial deleted successfully" });
	} catch (error) {
		next(error);
	}
};

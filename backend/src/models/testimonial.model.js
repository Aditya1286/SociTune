import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
	{
		userId: {
			type: String, // using clerkId
			required: true,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		content: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true }
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);

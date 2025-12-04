import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  tag: {
    type: String,
    required: true
  },
  img: {
    type: String,
    required: true
  },
  quote: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Testimonial = mongoose.model("Testimonial", testimonialSchema, "testimonials");

export default Testimonial;


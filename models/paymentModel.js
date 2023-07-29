const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "Payment must belong to a Product!"],
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Payment must belong to a User!"],
  },

  price: {
    type: Number,
    require: [true, "Booking must have a price."],
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },

  paid: {
    type: Boolean,
    default: true,
  },
})

bookingSchema.pre(/^find/, function (next) {
  this.populate("user").populate({
    path: "product",
    select: "name",
  })
  next()
})

const Payment = mongoose.model("Payment", paymentSchema)

module.exports = Payment

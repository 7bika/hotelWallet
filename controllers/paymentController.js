const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const Product = require("../models/productModel")
const Payment = require("../models/paymentModel")
const catchAsync = require("../utils/catchAsync")
const factory = require("./handlerFactory")

exports.getProductCheckoutSession = catchAsync(async (req, res, next) => {
  // * 1) Get the currently product
  const product = await Product.findById(req.params.productId)
  console.log(product)

  // * 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    // * the cancel url : once the purchase is done :
    success_url: `${req.protocol}://${req.get("host")}/my-product/?product=${
      req.params.productId
    }&user=${req.user.id}&price=${product.price}`,

    // * the cancel url : once the purchase is done :
    cancel_url: `${req.protocol}://${req.get("host")}/product/${product.name}`,

    // * email:
    customer_email: req.user.email,

    // * tour id
    client_reference_id: req.params.productId,

    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.summary,
            images: [`https://example.com/${product.image}`],
          },
          unit_amount: product.price,
        },
        quantity: 1,
      },
    ],
  })

  // * 3) Create session as response
  res.status(200).json({
    status: "success",
    session,
  })
})

// *  booking in the bd

exports.createProductBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { product, user, price } = req.query
  // * we only want to create a booking only if these fields are specified

  if (!user && !price && !product) return next()

  await Booking.create({ user, price, product })

  res.redirect(req.originalUrl.split("?")[0])
})

// * crud for the bookings
exports.createPayment = factory.createOne(Payment)
exports.getPayment = factory.getOne(Payment)
exports.getAllPayments = factory.getAll(Payment)
exports.updatePayment = factory.updateOne(Payment)
exports.deletePayment = factory.deleteOne(Payment)

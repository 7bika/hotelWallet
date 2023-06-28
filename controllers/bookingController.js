const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const Room = require("../models/roomModel")
const Tour = require("../models/tourModel")
const Booking = require("../models/bookingModel")
const catchAsync = require("../utils/catchAsync")
const factory = require("./handlerFactory")

exports.getTourCheckoutSession = catchAsync(async (req, res, next) => {
  // * 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId)
  console.log(tour)

  // * 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],

    // * the cancel url : once the purchase is done :
    success_url: `${req.protocol}://${req.get("host")}/my-tours/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,

    // * the cancel url : once the purchase is done :
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,

    // * email:
    customer_email: req.user.email,

    // * tour id
    client_reference_id: req.params.tourId,

    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: tour.slug,
            description: tour.summary,
            images: [`https://example.com/${tour.image}`],
          },
          unit_amount: tour.price,
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

exports.getRoomCheckoutSession = catchAsync(async (req, res, next) => {
  // Get the currently booked room
  const room = await Room.findById(req.params.roomId)

  if (!room) {
    return res.status(404).json({
      status: "error",
      message: "Room not found",
    })
  }

  // * Create checkout session 
  const session = await stripe.checkout.sessions.create({
    // Information about the session itself
    payment_method_types: ["card"],

    // * the cancel url : once the purchase is done :
    success_url: `${req.protocol}://${req.get("host")}/my-rooms/?room=${
      req.params.roomId
    }&user=${req.user.id}&price=${room.price}`,

    // * the cancel url :
    cancel_url: `${req.protocol}://${req.get("host")}/room/${room.slug}`,

    //* email
    customer_email: req.user.email,

    client_reference_id: req.params.roomId,

    // & Information about the product that the user is about to purchase
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: room.slug,
            description: room.summary,
            images: [`https://example.com/${room.image}`],
          },
          unit_amount: room.price,
        },
        quantity: 1,
      },
    ],
  })

  // * Create session as response
  res.status(200).json({
    status: "success",
    session,
  })
})


// *  booking in the bd
exports.createTourBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query
  // * we only want to create a booking only if these fields are specified

  if ((!tour && !user && !price)) return next()

  await Booking.create({ tour, user, price })

  res.redirect(req.originalUrl.split("?")[0])
})

exports.createRoomBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, room, user, price } = req.query
  // * we only want to create a booking only if these fields are specified

  if (!user && !price && !room) return next()

  await Booking.create({ room, user, price })

  res.redirect(req.originalUrl.split("?")[0])
})


// * crud for the bookings
exports.createBooking = factory.createOne(Booking)
exports.getBooking = factory.getOne(Booking)
exports.getAllBookings = factory.getAll(Booking)
exports.updateBooking = factory.updateOne(Booking)
exports.deleteBooking = factory.deleteOne(Booking)

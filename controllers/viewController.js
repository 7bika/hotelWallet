const Tour = require("./../models/tourModel")
const Room = require("./../models/roomModel")
const User = require("./../models/userModel")
const Booking = require("./../models/bookingModel")
const catchAsync = require("./../utils/catchAsync")
const AppError = require("../utils/appError")

// * requesting the overview page all the tour data will be retrieved from the db and the data will be passed into our template
exports.getOverview = catchAsync(async (req, res, next) => {
  // * 1) Get tour data from collection
  const tours = await Tour.find()
  const rooms = await Room.find()

  // * 2) Build template
  // * 3) Render that template using tour data from 1)
  res.status(200).render("overview", {
    title: "All Bookings",
    tours: tours,
    rooms: rooms,
  })
})

// ^ getting the tour of each tours
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  })

  if (!tour) {
    return next(new AppError("There is no tour with that name.", 404))
  }

  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("tour", {
      title: `${tour.title} Tour`,
      tour,
    })
})

// ^ getting the room of each rooms
exports.getRoom = catchAsync(async (req, res, next) => {
  // * 1) Get the data, for the requested tour (including reviews and guides)
  const room = await Room.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  })

  if (!room) {
    return next(new AppError("There is no room with that name.", 404))
  }

  // * 2) Build template
  // * 3) Render template using data from 1)
  res.status(200).render("room", {
    title: `${room.name} Room`,
    room: room,
  })
})

// ^ getting the login form
exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: "Log into your account",
  })
}

// ^ getting the signup form
exports.getSignupForm = (req, res) => {
  res.status(200).render("signup", {
    title: "sign up",
  })
}

// ^ getting the account
exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  })
}

// ^ getting the updating user data
exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  )

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  })
})


// & get all the bookings
exports.getMyBookings = catchAsync(async (req,res,next) => {

 // * 1) Find all bookings based on the user
 const bookings = await Booking.find({ user: req.user.id })

 // * 2) Find tours with the returned IDs
 // * map returns a new array with the new values in it 
 const tourIDs = bookings.map(el => el.tour)
 const roomIDs = bookings.map(el => el.room)

 // * select all the rooms or tours which have an id which is in the tourID array
 const tours = await Tour.find({ _id: { $in: tourIDs } })
 const rooms = await Room.find({ _id: { $in: roomIDs } })

 res.status(200).render('overview', {
   title: 'My Bookings',
   tours: tours,
   rooms: rooms
 })

})

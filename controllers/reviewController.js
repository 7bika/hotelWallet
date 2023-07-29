const catchAsync = require("../utils/catchAsync")
const Review = require("../models/reviewModel")
const AppError = require("../utils/appError")
const factory = require("../controllers/handlerFactory")

// & getting all reviews
exports.getAllReviews = factory.getAll(Review)
// exports.getAllReviews = catchAsync(async (req, res, next) => {

//    let filter = {} // & filter object that we're going to pass in find : find({options})

//    if (req.params.roomId) filter = { room: req.params.roomId }
//    if (req.params.tourId) filter = { tour: req.params.roomId }

//    const reviews = await Review.find(filter)

//    res.status(200).json({
//       status: 'success',
//       results: reviews.length,
//       data: {
//          reviews: reviews
//       }
//    })
// })

// & creating a review
exports.createReview = catchAsync(async (req, res, next) => {
  // ! TELLING the controller that it should use this room id (('/:roomId/reviews')) and the logged-in user's id:

  if (!req.body.room) req.body.room = req.params.roomId // * if we did not specify the room id in the body we wanna define that as the one coming from the URL
  if (!req.body.tour) req.body.tour = req.params.tourId
  if (!req.body.user) req.body.user = req.user.id // * from the checkedLoggedIn middleware

  try {
    const review = await Review.create(req.body)
    res.status(201).json({
      status: "success",
      data: {
        review: review,
      },
    })
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.user) {
      return next(new AppError("You cannot add multiple reviews", 400))
    } else {
      return next(
        new AppError("An error occurred while submitting your review.", 500)
      )
    }
  }
})

// & updating a review
exports.getReview = factory.getOne(Review)

// & updating a review
exports.updateReview = factory.updateOne(Review)
// exports.updateReview = catchAsync(async (req, res, next) => {

//    const review = Review.findByIdAndUpdate({ _id: req.params.id }, req.body, {  // ! data we want to change
//        ! the new updated document is gonna be returned
//       runValidators: true, new: true
//    })

//    if (!review) {
//       return next(new AppError('no review found with that id', 404))
//    }

//    res.status(200).json({
//       status: 'success',
//       data: {
//          review: review
//       }
//    })
// })

// & deleting a review
exports.deleteReview = factory.deleteOne(Review)
// exports.deleteReview = catchAsync(async (req, res, next) => {

//    const deletedReview = await Review.findByIdAndDelete(req.params.id)

//    if (!deletedReview) {
//       return next(new AppError('No review found with that ID', 404))
//    }

//    res.status(204).json({
//       status: 'success',
//       data: null
//    })
// })

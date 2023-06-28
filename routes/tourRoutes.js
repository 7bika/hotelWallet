const express = require('express')
const tourController = require('../controllers/tourController')
const authController = require('../controllers/authController')
const reviewController = require('../controllers/reviewController')
const reviewRouter = require('../routes/reviewRoutes')


const router = express.Router()


// & route for the nested routes : getting reviews on a one tour tours/:tourId/reviews
router.use('/:tourId/reviews', reviewRouter) // in case we ever encountered a route like this : /:tourId/reviews
// ! we have the same function in reviewRoutes //router should use reviewRouter as a router for ('/:roomId/reviews') // for this route '/:roomId/reviews' we use reviewRouter

// ! the reviewRoute doesn't get access to this room id parameter so we use mergeParams : true in reviewRoutes.js


// & route for the 5 cheapest rooms : alias route
router.route('/top-5-cheap').get(tourController.tourCheap, tourController.getAllTours)


// & route for the tour stats: aggregation pipeline
router.route('/tour-stats').get(tourController.tourStats)


// & route for the monthly plan
router.route('/monthlyPlan/:year').get(authController.checkLoggedIn, authController.restrictTo('admin'), tourController.monthlyPlan)


// & geo spatial routes
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi
// ! pass in the coordinates of where you are
// /233/center/34.111745,-118.113491/unit/mi
router.route('/tours_within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin)
// & get distance to a certain point from all the tours
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)
  

// & route for the tours
router.route('/')
   .get(authController.checkLoggedIn, tourController.getAllTours)
   .post(authController.checkLoggedIn, authController.restrictTo('admin', 'guide'), tourController.createTour)


// & route for the tour by id 
router.route('/:id')
   .get(tourController.getTour)
   .patch(authController.checkLoggedIn, authController.restrictTo('admin', 'guide'), tourController.uploadTourImages,  tourController.resizeTourImages, tourController.updateTour,)
   
   .delete(authController.checkLoggedIn, authController.restrictTo('admin', 'guide'), tourController.deleteTour)


// & route for the nested routes : getting reviews on a one tour tours/:tourId/reviews
// POST /tour/234fad4/reviews
// GET /tour/234fad4/reviews
// GET /tour/234fad4/reviews/abgt5698
// router.route('/:tourId/reviews')
//    .get(reviewController.getAllReviews)
//    .post(authController.checkLoggedIn, authController.restrictTo('user'), reviewController.createReview)


//router.use('/:tourId/reviews', reviewRouter) in case we ever encountered a route like this : /:tourId/reviews


module.exports = router
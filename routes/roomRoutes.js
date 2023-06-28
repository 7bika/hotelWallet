const express = require('express')
const roomController = require('../controllers/roomController')
const authController = require('../controllers/authController')
const reviewController = require('../controllers/reviewController')
const reviewRouter = require('../routes/reviewRoutes')


const router = express.Router()
// & app.use('/api/rooms', roomRouter)


// & nested routes :  ex : POST room/25142/reviews or GET room/5546/reviews/986a2
router.use('/:roomId/reviews', reviewRouter) // !  !! we have the same function in reviewRoutes //router should use reviewRouter as a router for ('/:roomId/reviews') // for this route '/:roomId/reviews' we use reviewRouter

// ! the reviewRoute doesn't get access to this room id parameter so we use mergeParams : true in reviewRoutes.js


//! alias : creating a route that is easy for the user:
router.route('/top-5-cheap').get(roomController.aliasTopRooms, roomController.getAllRooms)
//                                  //!middleware that comes before the getAllRooms //we need thegetAllRooms cuz it's a get method for the rooms  //sna3na route wa7dou bitbi3a bech nediw getAllrooms


// ^route for the aggregation method:
router.route('/room-stats').get(roomController.getRoomStats)


//^ route for the aggregation pipeline for the getMonthlyPlan function:
router.route('/monthly-plan/:year').get(authController.checkLoggedIn, authController.restrictTo('admin'), roomController.getMonthlyPlan)


//^ route for geospatial data:
// router.route('/places-within/:distance/center/:latlng/unit/:unit').get(roomController.getPlacesWithin)
// router.route('/distancesBetween/:latlng/unit/:unit').get(roomController.getDistancesBetween)


router.route('/')
   // ^will return an error if the user is not logged in or it will call the next middleware which is getAllRooms handler: 
   .get(authController.checkLoggedIn, roomController.getAllRooms)
   .post(authController.checkLoggedIn, authController.restrictTo('admin'), roomController.createRoom)


router.route('/:id')
   .get(roomController.getRoom)
   .patch(authController.checkLoggedIn, authController.restrictTo('admin'), roomController.uploadRoomImages, roomController.resizeRoomImages, roomController.updateRoom)
   //                                     //* roles allowed to interact with this resource
   .delete(authController.checkLoggedIn, authController.restrictTo('admin'), roomController.deleteRoom)


// & nested routes : 
// & EX : POST room/25142/reviews or GET room/5546/reviews/986a2
// router.route('/:roomId/reviews')
//    .get()
//    .post(authController.checkLoggedIn, authController.restrictTo('user'), reviewController.createReview)


module.exports = router














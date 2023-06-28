const express = require('express')
const reviewController = require('../controllers/reviewController')
const authController = require('../controllers/authController')

const router = express.Router({ mergeParams: true }) // ! mergeParams : true  // ! we want to access the params from the parent router //:roomId 


// & check if the user is logged after this point
router.use(authController.checkLoggedIn) // * allowing only logged in users


// * POST /room/45525/reviews OR
// * POST /reviews 
// * will be handled with this route :
router.route('/') //we're going to mount this router on api/reviews : api/reviews/
   .get(reviewController.getAllReviews)
   .post(authController.restrictTo('user'), reviewController.createReview)
//authController.checkLoggedIn


router.route('/:id')
   .get(reviewController.getReview)
   .patch(authController.restrictTo('admin', 'user'), reviewController.updateReview) // * restricted to only user and admin
   .delete(authController.restrictTo('admin', 'user'), reviewController.deleteReview) // * restricted to only user and admin


module.exports = router
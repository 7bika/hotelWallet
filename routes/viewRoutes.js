const express = require("express")
const viewController = require("./../controllers/viewController")
const authController = require("./../controllers/authController")
const bookingController = require("./../controllers/bookingController")

const router = express.Router()

router.get("/", bookingController.createTourBookingCheckout , bookingController.createRoomBookingCheckout, viewController.getOverview)

// router.get("/", viewController.getOverviewRoom)

router.get("/tour/:slug", viewController.getTour)
// * localhost:3000/api/tour/the-park-camper  the slug : the-park-camper

router.get("/room/:slug", viewController.getRoom)

router.get("/login", viewController.getLoginForm)

router.get("/signup", viewController.getSignupForm)

router.get("/me", viewController.getAccount)

router.get("/my-bookings", viewController.getMyBookings)

router.post(
  "/submit-user-data",
  authController.checkLoggedIn,
  viewController.updateUserData
)

module.exports = router

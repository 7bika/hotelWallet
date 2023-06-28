const express = require("express")
const bookingController = require("./../controllers/bookingController")
const authController = require("./../controllers/authController")

const router = express.Router()

router.use(authController.checkLoggedIn)

// router.get("/checkout-session/:id", bookingController.getCheckoutSession)
router.get(
  "/checkout-session/tour/:tourId",
  bookingController.getTourCheckoutSession
)
router.get(
  "/checkout-session/room/:roomId",
  bookingController.getRoomCheckoutSession
)

// router.get(
//   "/checkout-session/:tourId/:roomId",
//   bookingController.getCheckoutSession
// )

// router.get('/checkout-session/:roomId', bookingController.getCheckoutSession)

router.use(authController.restrictTo("admin"))

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking)

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking)

module.exports = router

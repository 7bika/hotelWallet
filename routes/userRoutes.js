const express = require("express")
const userController = require("../controllers/userController")
const authController = require("../controllers/authController")
const reviewController = require("../controllers/reviewController")
const multer = require("multer") //npm i multer

const router = express.Router()

//  middleware param : that runs only for a certain param: in our case : /:id
// ?  router.param('id', (req, res, next, val) => {
// ?  console.log(`user id is: ${val}`) //5
// ?  next()
// })

//WE CAN ALSO DO IT IN THE SAME FUNCTION:
//  * router.param('id', (req, res, next, val) => {

//  *  console.log(`user id is: ${val}`)
//  *  if (user.id > users.length) {
//  *    res.status(404).json({
//  *      status: 'failed',
//  *       message: 'user not found'
//  *     })
//  *   }
//  * })

// router.param('id', userController.checkID)
// router.param('id', userController.checkBody)

// & login and sign routes :
router.post("/signup", authController.signup)
router.post("/login", authController.login)
router.get("/logout", authController.logout)

// & reset password and forgot password routes :
router.post("/forgotPassword", authController.forgotPassword) // * will only receive the email address
router.patch("/resetPassword/:token", authController.resetPassword) // * will receive the token and the new password

// router.use(authController.checkLoggedIn) // * check all the routes after this point if they are logged in

// & updating the logged in user's password
router.patch(
  "/updateMyPassword",
  authController.checkLoggedIn,
  authController.updatePassword
)
// * will run after checking if the user is logged in and updating his current password

// & updating the logged in user's data
router.get(
  "/me",
  authController.checkLoggedIn,
  userController.getMe,
  userController.getUser
)
// * will run after checking if the user is logged in and running the the getMe middleware that req.params.id = req.user.id and getUser to get the user cuz we don't have a getMe it s only a middleware

router.patch(
  "/updateMe",
  authController.checkLoggedIn,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
)
//upload.single("photo")
// * will run after checking if the user is logged in and updating his data like name and email //upload.single() cuz we want to update one single image from multer and inside the () we pass the name of the field that is going to hold the image to upload

router.delete(
  "/deleteMe",
  authController.checkLoggedIn,
  userController.deleteMe
)
// * will run after checking if the user is logged in and deactivate his account

// & get all users and create a new user routes : only available by admin
// router.use(authController.checkLoggedIn, authController.restrictTo("admin")) // * check all the routes after this point and give access only to admin // * only restricted to admin

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser)

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)

module.exports = router

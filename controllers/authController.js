//* creating new users , logging users in , updating password , checking if user is logged in or not all in here :

const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const sendEmail = require("../utils/email")
const { token } = require("morgan")
const crypto = require("crypto")
const Email = require("../utils/email")


// ^ signing the token:
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}
//^   { id: id }: the payload is an object for all the data that we're going to store inside the token
//^   process.env.JWT_SECRET : secret is a string for our secret
//^   the token is a string that is signed with the secret key and the id of the user
//^   { expiresIn: process.env.JWT_EXPIRES_IN} : options : when the jwt should expire : JWT_EXPIRES_IN = 30d

// ! sending the token with the cookie :
const createSendToken = (user, statusCode, res) => {
  // ^ signing the token :
  //& creating our token :
  const token = signToken(user._id)

  // ^ cookies options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 72 * 60 * 60 * 1000
    ), //^ convert to ms // expires after 72 hours
    samesite: "None",
    // secure: true, //the cookie will only be sent in https //https
    httpOnly: true, //^ cannot be accessed or modified by any browser
  }

  // ^ sending the cookie with the response
  res.cookie("jwt", token, cookieOptions) // * name of the cookie : jwt // and the data tha twe want to send back in the cookie : token // * options

  // ^ remove the password from the output
  user.password = undefined

  // ^ sending the response
  res.status(statusCode).json({
    status: "success",
    token: token,
    data: {
      user: user,
    },
  })
}

// ! create and send a cookie : attach it to the response object
// const sendCookie = () => { // * name of the cookie : jwt // and the data tha twe want to send back in the cookie : token
//    res.cookie('jwt', token, {
//       expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000), //the browser will delete it after this expiration date //convert it to ms
//       secure: true, //^ only with https : secure connection
//       httpOnly: true //^ cannot be accessed or modified by any browser
//    })
// }

//signup:
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  })

  //& creating our token :
  // const token = signToken(newUser._id)
  // & is the same as this
  // jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //    expiresIn: process.env.JWT_EXPIRES_IN
  // })
  //^ the payload is an object for all the data that we're going to store inside the token
  //^ secret is a string for our secret
  //^ the token is a string that is signed with the secret key and the id of the user
  //^ options : when the jwt should expire : JWT_EXPIRES_IN = 30d

  // & sending the response object:
  // res.status(201).json({
  //    status: 'success',
  //    token,
  //    data: {
  //       user: newUser
  //    }
  // })

  const url = `${req.protocol}://${req.get('host')}/me`
  console.log(url)

  //& sending email(welcoming email)
  await new Email(newUser, url).sendWelcomeEmail()

  createSendToken(newUser, 201, res)
})

//login:
exports.login = catchAsync(async (req, res, next) => {
  // ? destructuring the req.body to get email and password
  const { email, password } = req.body

  // ! 1 check if email and password exist :

  if (!email || !password) {
    return next(new AppError("please provide an email and a password", 400))
  }

  // ! 2 check if the user exists && password is correct :

  // * finding user by email
  const user = await User.findOne({ email: email }).select("+password") //req.body.email // ! we need to select the password from the database cuz we did select :false //! if we want the field that by default not selected we add '+' in front of the field's name
  // user = user document is the result of a query
  console.log(user)

  // ! compare the password from the database and the one the user posted
  //  ? 1234657 === $2a$12$Mkvczct6qq/vkBDdjhYh2.Cbanl4LzHnvSMK3g2i.toIQGMmFd2Sy
  // * instance method : available on all of the user document
  // ? candidate password : original password
  // ? user password : hashed password
  // ? correctPassword : instance method that we created in the userModel

  // * if the user doesn't exist then this line of code won't run
  if (!user || !(await user.correctPassword(password, user.password))) {
    //user's password field
    return next(new AppError("incorrect email or password", 401))
  }

  // ! 3 if everything is ok , send the token back to the client

  // const token = signToken(user._id)
  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //expiresIn: process.env.JWT_EXPIRES_IN })

  // res.status(200).json({
  //   all we need is the token
  //    status: 'success',
  //    data: {
  //       token: token
  //    }
  // })

  createSendToken(user, 200, res)
})

exports.logout = catchAsync(async (req, res, next) => {
  
  // ! 1 sending a cookie with the token that expires immediately
  res.cookie("jwt", "logged Out", {
    // * same name as the jwt from before
    expires: new Date(Date.now() + 5 * 1000), //^ expires after 10 seconds
    // httpOnly: true, //^ cannot be accessed or modified by any browser
  })

  // ! 2 sending the response
  res.status(200).json({
    status: "success",
  })
})

// * the user is logged in
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      )

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id)
      if (!currentUser) {
        return next()
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next()
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser
      return next()
    } catch (err) {
      return next()
    }
  }
  next()
}

// * protect the route only for if logged in
exports.checkLoggedIn = catchAsync(async (req, res, next) => {
  let token

  // ! 1 getting token and check if it exists :

  // * send a token using a http header with the request : key : Authorization : value : Bearer : the token : // send jwt as a header
  // & read the token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // ! split the string into an array by a space and getting the element of the index 1
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  // * if there was no jwt in the authorization header then let's look at the cookie and the token will be that cookie
  console.log(token)

  // & check if the token exists
  if (!token) {
    return next(
      new AppError("you are not logged in ! please log in to get access", 401)
    )
  }

  // ! 2 validate the token : jwt verifies if the signature is valid :

  // ? verifying if someone manipulated the token or not:

  // * promisify the jwt.verify function :
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  // * gonna run as soon as the verification is completed :
  //^ the decoded payload is an object with the id of the user
  console.log(decoded) // {id: 0322566 , iat:55555 , exp: 261297}

  // ! 3 check if the user still exists :

  const currentUser = await User.findById(decoded.id) // *id in the payload from jwt decoded
  //* EX : { id: '6432b0e0fc33443ba8ec93b5', iat: 1681045441, exp: 1681131841 }

  if (!currentUser) {
    return next(
      new AppError(
        "the user belonging to this token does no longer exist ",
        401
      )
    )
  }

  // ! 4 if user changed password after the token was issued :

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    )
  }

  // ! 5 grant access to protected route :

  req.user = currentUser // * so that we can use it in the next middleware function with req.user

  next()
})

exports.restrictTo = (...roles) => {
  // ! we want to pass arguments into the middleware parameter : who are allowed to access the resource //in our case admin
  // ! creating a wrapper function that will then create the middleware function that we want to create
  // ! this middleware function will have access to ...roles simply because closures
  // !  ...roles will create an array of all the arguments that we specify
  // ! ['admin', 'user'] when the role is inside that array it has access , role = 'user' user does not have permission

  // ! when do we wanna give a user access to a certain resource ? when his role is in the array of the roles that are allowed to access that route

  // ! roles ['admin', 'user']. role='user' or role='admin'

  return (req, res, next) => {
    // roles ['admin', 'user']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      )
    }
    next()
  }
}

//^ reset password functionality :
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // ! 1 get user based on posted email:

  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError("there is no user with that email address", 404))
  }

  // ! 2 generate the random token :

  // * storing the reset token :
  const resetToken = user.createPasswordResetToken()

  // ! we need to use .save() because we only did modify the document with createPasswordResetToken() and did not save the document afterwards and also because for everything related to password and to the user we always use save because we want to run all the validator and the save middleware functions

  await user.save({ validateBeforeSave: false }) //! deactivate all the validators that we specified in our schema because we did not post all the required fields from the schema in the req.body when we hit that route of forgetPassword
  console.log(resetToken, user)

  // ! 3 send the token back in an email:
  // * reset url :
  // * http://localhost:3000/api/users/resetPassword/:token
  // * protocol : http or https //original token

  // const resetURL = ` ${req.protocol}://${req.get(
  //   "host"
  // )}/api/users/resetPassword/${resetToken}  `

  const message = `forgot your password ? submit a patch request with your new password and passwordConfirm to : ${resetURL}.\nIf you did not forget your password , please ignore this email !`

  try {

    const resetURL = ` ${req.protocol}://${req.get(
      "host"
    )}/api/users/resetPassword/${resetToken}`

    // await sendEmail({
    //   email: req.body.email,
    //   subject: "your password reset token (valid for 15 minutes)",
    //   message: message,
    // })

    // & with new mail
    await new Email(user, resetURL).sendPasswordReset()

    res.status(200).json({
      status: "success",
      message: "token sent to email",
    })
  } catch (err) {
    // * resetting the passwordResetToken and the passwordResetExpires so we can send again
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(
      new AppError("there was an error sending the email. try again later", 500)
    )
  }
})

//^ reset password functionality :
exports.resetPassword = catchAsync(async (req, res, next) => {
  //! 1 encrypt the token and compare to the one in the database
  // ! resetToken : non encrypted : in the url in user model and passwordResetToken : encrypted : in the database
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex")

  //! 2 get user based on the token : no email no nothing the only thing we know about the user is the token
  const user = await User.findOne({
    // fields
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }, // & comparing the date of the passwordResetExpires to date.now() if token has not yet expired
  })

  //! 3 if token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError("token is invalid or has expired", 400))
  }

  //? updating the password and the passwordConfirm :
  user.password = req.body.password // * this user.password field = sending the password via the req.body
  user.passwordConfirm = req.body.passwordConfirm

  //~ deleting the reset token and expires :
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined

  await user.save() //! we did not turn off the validator cuz we wanted to validated if the password === passwordConfirm

  //! 4 update changedPasswordAt property for the user inside the userModel
  //! 5 log the user in : send the jwt to the client
  // const token = signToken(user._id)

  // res.status(200).json({
  //    status: 'success',
  //    data: {
  //       token
  //    }
  // })

  createSendToken(user, 200, res)
})

// & updating the logged in user's password by sending three passwords : passwordCurrent, password : the new one , passwordConfirm
exports.updatePassword = catchAsync(async (req, res, next) => {
  // ! asking the user for his current password before updating it
  //! 1 get the user from the collection:  only for logged in users
  const user = await User.findById(req.user.id).select("+password") //we already have our user in our request object
  // the id is coming from the checkLoggedIn middleware

  //! 2 check if the posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    //* correctPassword instance to compare passwordCurrent from the body : the new password and user.password is the already existed password in the database
    return next(new AppError("your current password is wrong", 401))
  }

  //! 3 if correct , update password
  //updating these fields : password and passwordConfirm
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm

  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined

  await user.save()

  // ^ why did we not use findByIdAndUpdate instead of save() because the validator function is not going to run when we use findByIdAndUpdate validate: this.password is not defined when we update and the pre('save') = .save() are not going to run either cuz we need the other fields and by using findbyidandupdate we only care for the provided fields in the body
  // validator: function (passwordConfirm) return this.password === passwordConfirm

  //! 4 log user in , send JWT back to the user now logged in the password that was just updated
  // const token = signToken(user._id)

  // res.status(200).json({
  //    status: 'success',
  //    data: {
  //       token
  //    }
  // })

  createSendToken(user, 200, res)
})

//how to implement two factor authentication ?
//? 1 user logs in with email and password
//? 2 server sends a random token to the user's email
//? 3 user sends the token back to the server
//? 4 server checks if the token is correct and then only then sends the jwt to the client

//^ two factor authentication :
exports.twoFactorAuthentication = catchAsync(async (req, res, next) => {
  //? 1 user logs in with email and password
  const { email, password } = req.body

  //? 2 server sends a random token to the user's email

  //? 2.1 get user from collection
  const user = await User.findOne({ email })

  //? 2.2 if user does not exist : send error
  if (!user) {
    return next(new AppError("there is no user with this email", 404))
  }

  //? 2.3 if user exists : generate random token
  const randomToken = Math.floor(100000 + Math.random() * 900000)

  //? 2.4 save the random token to the database
  console.log(randomToken)

  //? 2.4 save the random token to the user's document
  user.twoFactorAuthenticationCode = randomToken
  await user.save({ validateBeforeSave: false })

  //? 2.5 send the random token to the user's email
  const message = `your two factor authentication code is : ${randomToken}`
  try {
    await sendEmail({
      email: req.body.email,
      subject: "your two factor authentication code (valid for 15 minutes)",
      message: message,
    })
  } catch (err) {
    return next(
      new AppError("there was an error sending the email. try again later", 500)
    )
  }

  res.status(200).json({
    status: "success",
    message: "token sent to email",
  })

  //? 3 user sends the token back to the server
  //? 4 server checks if the token is correct and then only then sends the jwt to the client
  //? 5 server checks if the token is correct and then only then sends the jwt to the client

  //? 3.1 get the token from the user
  //? 3.2 compare the token to the one in the database
  //? 3.3 if the token is correct : send the jwt to the client
  //? 3.4 if the token is incorrect : send error
  //? 3.5 if the token is expired : send error
  //? 3.6 if the token is not found : send error

  //? 4 server checks if the token is correct and then only then sends the jwt to the client
  //? 5 server checks if the token is correct and then only then sends the jwt to the client

  //? 4.1 get the token from the user
  //? 4.2 compare the token to the one in the database
  //? 4.3 if the token is correct : send the jwt to the client
  //? 4.4 if the token is incorrect : send error
  //? 4.5 if the token is expired : send error
  //? 4.6 if the token is not found : send error

  //? 5 server checks if the token is correct and then only then sends the jwt to the client
  //? 6 server checks if the token is correct and then only then sends the jwt to the client

  //? 5.1 get the token from the user
  //? 5.2 compare the token to the one in the database
  //? 5.3 if the token is correct : send the jwt to the client
  //? 5.4 if the token is incorrect : send error
})

// JWT_COOKIE_EXPIRES = 1
// JWT_EXPIRES_IN = 30d

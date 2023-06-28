// ! in order to get rid of our try catch bloc we simply wrapped our async functions inside of catchAsync fun that we just created by using .catch to catch any errors instead of try and catch// async .catch() // this function will then return a new anonymous function which is return (req, res, next) => {fn(req, res, next).catch(next)} which will then be assigned to createRoom will be called first 

module.exports = fn => {
   return (req, res, next) => {
      fn(req, res, next).catch(next) // * getting the function and catching the promise 
   }
}


// pass in a function all the function that try and catch
//call this function in here (createRoom or any async function) and that function should receive req ,res ,and next and that function is asynchronous so it returns a promise and we need to catch that promise

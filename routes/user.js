var express = require("express");
var router = express.Router();
var productHelper = require("../helpers/product-helper");
var userHelpers = require("../helpers/user-helper");
const { response } = require("../app");
const adminHelpers = require("../helpers/admin-helpers");

const disableCache = (req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};
/* const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/login");
  }
}; */

const verifyLogin = (req, res, next) => {
  if (req.session.user.loggedIn) {
    next();
  } else {
    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      res.json({ status: false, loginRedirect: true });
    } else {
      res.redirect("/login");
    }
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  productHelper.getAllProducts().then((products) => {
    res.render("user/view-products", { products, user, cartCount });
  });
});

router.get("/login", disableCache, (req, res) => {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginErr: req.session.userLoginErr });
   req.session.userLoginErr =false
  }
});

router.get("/signUp", disableCache, (req, res) => {
  res.render("user/signup");
});

router.post("/signup", (req, res) => {
  userHelpers.doSignUp(req.body).then((response) => {
    console.log("response here");
    console.log(response.Name);
    console.log("response here ends");
   
    req.session.user = response;
 req.session.user.loggedIn = true;
    res.redirect("/");
  });
});

router.post("/login", (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      
      req.session.user = response.user;
       req.session.user.loggedIn = true;
      res.redirect("/");
    } else {
      req.session.userLoginErr = "Invalid Username or Password";
      res.redirect("/login");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.user=null
  res.redirect("/");
});



router.get("/Cart", verifyLogin, (req, res) => {
  res.render("user/cart");
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  console.log("API calls");
  let prdId = req.params.id;
  userHelpers.addToCart1(prdId, req.session.user._id).then((response) => {
    /*  res.redirect('/') */
    res.json({ status: true });
  });
});

router.get("/viewCart/:id", verifyLogin,async (req, res) => {

  let total= await userHelpers.getTotalAmount(req.session.user._id)
  let userId = req.params.id;
  let user = req.session.user;

  userHelpers.getCartProducts(userId).then((products) => {
    console.log(products);
    res.render("user/cart", { products, user,total });
  });
});





router.post('/change-product-qty', (req, res) => {
  req.body.userId = req.session.user._id;
    userHelpers.changePrdQty(req.body).then((response) => {
        res.json(response); // You MUST send a response back to the AJAX call
    });
});


router.post('/remove-Product',(req,res)=>{
  userHelpers.removeProduct(req.body).then((response)=>{
    res.json(response)

  })
})

router.get("/place-order",verifyLogin, async (req,res)=>{
    
  let total= await userHelpers.getTotalAmount(req.session.user._id)
  

  res.render('user/placeOrder',{total,user:req.session.user})
})







router.post('/place-order',async (req,res)=>{
console.log("placeOrderPost")
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice= await userHelpers.getTotalAmount(req.body.userId)
 userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{

  if(req.body['payment-method']==='COD'){

 res.json({codSuccess:true})
  }
else{
  userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
    res.json(response)

  })

}
 

 })

  console.log(req.body)

})


router.get('/orderList',verifyLogin,async(req,res)=>{
  let userId=req.session.user._id
  console.log(userId)
 await userHelpers.viewAllOrders(userId).then((orders)=>{
 res.render('user/orders',{orders,user:req.session.user})
  })


 
})


router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
    let products = await userHelpers.getOrderProducts(req.params.id);
    res.render('user/orderProducts', { user: req.session.user, products });
});

router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})




router.post('/verify-payment',(req,res)=>{
  console.log("reached here at verifyPayment")
  console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changeOrderStatus(req.body['order[receipt]']).then((response)=>{
        console.log("online order successfully Placed")
res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false,errMs:'Payment Failed'})
  })
})














module.exports = router;

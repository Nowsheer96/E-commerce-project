var express = require("express");
const { render, response } = require("../app");
var router = express.Router();
var productHelper = require("../helpers/product-helper");
var adminHelpers = require("../helpers/admin-helpers");

/* Handlebars.registerHelper('increment', function(value) {
    return parseInt(value) + 1;
});
 */
const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next();
  } else {
    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      res.json({ status: false, loginRedirect: true });
    } else {
      res.redirect("/admin");
    }
  }}
const Handlebars = require("handlebars");

// Now your helper code will work:
Handlebars.registerHelper("increment", function (value) {
  return parseInt(value) + 1;
});
/* GET users listing. */
router.get("/home",verifyLogin, function (req, res, next) {
   let admin = req.session.admin;
   console.log(admin)
  productHelper.getAllProducts().then((products) => {
    res.render("admin/view-products", { admin:true, admin, products });
  });
});

router.get("/add-product",verifyLogin, function (req, res) {
   let admin=req.session.admin;
  res.render("admin/addProduct",{admin:true, admin});
 
});

router.get('/allUser',verifyLogin,async(req,res)=>{
  let users =await adminHelpers.getAllUsers()
  console.log(users)
res.render('admin/allUsers',{ admin:req.session.admin,users})

})


router.post('/edit-user',(req,res)=>{
   console.log("req.body edit user")
  console.log(req.body)
  adminHelpers.updateUser(req.body).then(()=>{
    res.json({status:true})
  })
})


router.get('/delete-user/:id',(req,res)=>{
  adminHelpers.deleteUser(req.params.id).then(()=>{
    res.json({status:true})
  })
})



router.get('/orders',verifyLogin,(req,res)=>{

   adminHelpers.getAllOrders().then((orders)=>{
  res.render("admin/allOrders",{admin:req.session.admin,orders})
   }) 

})




router.post("/addProduct", (req, res) => {
  console.log("!!!!!!!!!!!!!!!here check!!!!!!!!!!!!!!!");
  console.log(req.body);
  console.log(req.files.Image);

  productHelper.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/product-images/" + id + ".jpg", (err) => {
      if (!err) {
        res.render("admin/addProduct");
      } else console.log(err);
    });
  });
});

router.get("/logout", (req, res) => {
  req.session.admin=null
  res.redirect("/admin");
});

router.get('/delete-product/:id',(req,res)=>{
  let prdId=req.params.id
  productHelper.deleteProduct(prdId).then((response)=>{
    res.redirect('/admin/')
  })
})


router.get('/edit-product/:id',verifyLogin,(req,res)=>{
  let prdId=req.params.id
  productHelper.getOneProduct(prdId).then((product)=>{
    res.render('admin/edit-product',{product})
  })

})


router.post('/editProduct/:id',verifyLogin,(req,res)=>{
  let prdId=req.params.id
  console.log("here check!!!!!!!!!!!!!")
  console.log(req.body)
  productHelper.updateProduct(req.body,prdId).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/' + prdId + '.jpg')
    }
  })
})




router.get("/",  (req, res) => {
  if (req.session.admin) {
    res.redirect("/admin/home");
  } else {
    res.render("admin/adminlogin", {admin:true, loginErr: req.session.adminLoginErr });
   req.session.adminLoginErr =false
  }
});


router.post("/adminlogin", (req, res) => {
  console.log(req.body)
  adminHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      console.log("admin logged in successfully")
      req.session.admin = response.admin;
      console.log("admin logged in successfully")
      let admin=req.session.admin
       req.session.adminLoggedIn = true;
        console.log(req.session.admin)
         console.log("admin logged in successfully")
      res.redirect("/admin/home");
    } else {
      
      req.session.adminLoginErr = "Invalid Username or Password";
      res.render("admin/adminlogin", { loginErr: req.session.adminLoginErr });
    }
  });
});

router.get('/view-products', verifyLogin,(req, res) => {
    // Logic to fetch products and render view
    res.render('admin/view-products'); // This matches your views/admin folder
});

router.get("/adminsignUp", (req, res) => {
  console.log('admin signup called')
  res.render("admin/admin-Signup",{admin:true});
});



router.post("/adminsignup", (req, res) => {
  adminHelpers.doSignUp(req.body).then((response) => {
    console.log("response here");
    console.log(response.username);
    console.log("response here ends");
   
    req.session.admin = response;
 req.session.adminLoggedIn = true;
    res.render("admin/view-products",{admin:true});
  });
});


router.post('/update-order-status',(req,res)=>{
  adminHelpers.updateOrderStatus(req.body.orderId,req.body.status).then(()=>{
    res.json({status:true})
  })
})





module.exports = router;

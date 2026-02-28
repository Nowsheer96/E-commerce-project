var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { response } = require("../app");
const Razorpay = require("razorpay");
const { resolve } = require("dns");


    var instance=new Razorpay({
      key_id:'rzp_test_SLIyYSK9KYwFZ9',
      key_secret:'od2DmosGqb3XghZfaHZ4BLrc'
    })

const getTotalAmount = (userId) => {
  return new Promise(async (resolve, reject) => {
    let total = await db
      .get()
      .collection(collections.CART_COLLECTION)
      .aggregate([
        { $match: { user: new ObjectId(userId) } },
        { $unwind: "$products" },
        {
          $project: {
            item: "$products.item",
            quantity: "$products.quantity",
          },
        },
        {
          $lookup: {
            from: collections.PRODUCT_COLLECTION,
            localField: "item",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $project: {
            quantity: 1,
            product: { $arrayElemAt: ["$product", 0] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
          },
        },
      ])
      .toArray();

    // Check if cart is empty to avoid index error
    if (total && total[0]) {
      resolve(total[0].total);
    } else {
      resolve(0);
    }
  });
};
module.exports = {
  doSignUp: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get().collection(collections.USER_COLLECTION).insertOne(userData);
      resolve(userData);
      console.log("userData here");
      console.log(userData);
      console.log("userData here ends");
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collections.USER_COLLECTION)
        .findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("login Success");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("NO USER");
        resolve({ status: false });
      }
    });
  },

  addToCart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });
      console.log("check here for user :::::::");
      console.log(userCart);
      console.log("check here for user up :::::::");
      if (userCart) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { user: new ObjectId(userId) },
            { $push: { products: new ObjectId(proId) } },
          )
          .then((response) => {
            resolve();
          });
      } else {
        let cartObj = {
          user: new ObjectId(userId),
          products: [
            {
              item: new ObjectId(proId),
              quantity: 1,
            },
          ],
        };
        await db
          .get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then((response) => {
            resolve();
          });
      }
    });
  },

  addToCart1: (proId, userId) => {
    let prdObj = {
      item: new ObjectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let cartUser = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });
      if (cartUser) {
        let prdExist = cartUser.products.findIndex(
          (product) => product.item == proId,
        );

        if (prdExist != -1) {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              {
                user: new ObjectId(userId),
                "products.item": new ObjectId(proId),
              },
              { $inc: { "products.$.quantity": 1 } },
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collections.CART_COLLECTION)
            .updateOne(
              { user: new ObjectId(userId) },
              { $push: { products: prdObj } },
            )
            .then(() => {
              resolve();
            });
        }
      } else {
        let cartObj = {
          user: new ObjectId(userId),
          products: [prdObj],
        };

        db.get()
          .collection(collections.CART_COLLECTION)
          .insertOne(cartObj)
          .then(() => {
            resolve();
          });
      }
    });
  },

  /* getCartProducts :(userId)=>{
    return new Promise(async(resolve,reject)=>{
       db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)}).then((response)=>{
        resolve(response)
      }) 


        let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([
          {$match:{user:new ObjectId(userId) }}
            ,{$lookup:{
                from:collections.PRODUCT_COLLECTION,
                let:{proList:'$products'},
                pipeline:[
                  {
                    $match:{
                      $expr:{
                        $in:['$_id','$$proList']
                      }
                    }

                  }
                ],
                as:'cartItems'
              
            }
          }
        ]).toArray()
        resolve(cartItems)
    })
  } */

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      // Starts the aggregation pipeline on the Cart collection to join product data
      let cartItems = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            // Filters the collection to find only the cart document belonging to the specific user
            $match: { user: new ObjectId(userId) },
          },
          {
            // Breaks the 'products' array into individual documents (one per product) so we can process them
            $unwind: "$products",
          },
          {
            // Extracts 'item' (the product ID) and 'quantity' from the unwound product object to the top level
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            // Performs a 'join' with the Product collection based on the item ID
            $lookup: {
              from: collections.PRODUCT_COLLECTION, // The collection to join with
              localField: "item", // The field in the Cart document
              foreignField: "_id", // The matching field in the Product document
              as: "product", // The name of the new array containing the matched data
            },
          },
          {
            // Refines the output structure for the frontend
            $project: {
              item: 1, // Keeps the item ID
              quantity: 1, // Keeps the quantity
              // Since $lookup returns an array, this extracts the first matching object into a single 'product' field
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray(); // Converts the aggregation cursor results into a standard JavaScript array

      resolve(cartItems); // Returns the final array of cart items with full product details to the caller
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      // Find the cart belonging to the user
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });

      if (cart && cart.products) {
        // Loop through the products array and add each item's quantity to the total
        cart.products.forEach((product) => {
          count += product.quantity;
        });
      }

      resolve(count);
    });
  },

  /*   changePrdQty:({cartId,prdId,count})=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartId),'products.item':new Object(prdId)},{
        $inc:{'products.$.quantity':parseInt(count)}

      })
    })
  } */

  /*  changePrdQty:(details)=>{
        let count = parseInt(details.count);
    let cartId = details.cart; // Matches AJAX data key
    let prdId = details.product; // Matches AJAX data key
        console.log('changePrdQty reached')
         console.log(details)
    return new Promise((resolve,reject)=>{
      db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartId),'products.item':new ObjectId(prdId)},{
        $inc:{'products.$.quantity':count}

      }).then(()=>{
        resolve()
      })
    })
  } */

  /* changePrdQty: (details) => { // Removed the {} around details
    let count = parseInt(details.count);
    let cartId = details.cart; // Matches AJAX data key
    let prdId = details.product; // Matches AJAX data key

    return new Promise((resolve, reject) => {
        db.get().collection(collections.CART_COLLECTION)
            .updateOne(
                { _id: new ObjectId(cartId), 'products.item': new ObjectId(prdId) },
                { $inc: { 'products.$.quantity': count } }
            ).then((response) => {
                resolve(response);
            }).catch((err) => {
                reject(err);
            });
    });
} */

  /* changePrdQty: (details) => { 
    let count = parseInt(details.count);
    let cartId = details.cart; 
    let prdId = details.product; 
   let quantity = parseInt(details.quantity);
    let userId = details.userId;
    
    console.log("it called me")

    return new Promise(async(resolve, reject) => {
if(count==-1 && quantity==1){
await db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartId)},
{
  $pull:{products:{item:new ObjectId(prdId)}}
}).then(async (response)=>{
   let total= await getTotalAmount(req.session.user._id)
  resolve({removeProduct:true,total})
})

} else{



       await  db.get().collection(collections.CART_COLLECTION)
            .updateOne(
                { _id: new ObjectId(cartId), 'products.item': new ObjectId(prdId) },
                { $inc: { 'products.$.quantity': count } }
            ).then(async(response) => {
                let total= await getTotalAmount(req.session.user._id)
                resolve(response,total);
            }).catch((err) => {
                reject(err);
            });
    }});
} */

  /*  changePrdQty: (details) => {
    let count = parseInt(details.count);
    let cartId = details.cart;
    let prdId = details.product;
    let quantity = parseInt(details.quantity);
    let userId = details.userId; // Passed from router

    return new Promise(async (resolve, reject) => {
        if (count == -1 && quantity == 1) {
            await db.get().collection(collections.CART_COLLECTION)
                .updateOne({ _id: new ObjectId(cartId) }, {
                    $pull: { products: { item: new ObjectId(prdId) } }
                });
            
            let total = await this.getTotalAmount(userId); // Fixed userId
            resolve({ removeProduct: true, total });
        } else {
            await db.get().collection(collections.CART_COLLECTION)
                .updateOne(
                    { _id: new ObjectId(cartId), 'products.item': new ObjectId(prdId) },
                    { $inc: { 'products.$.quantity': count } }
                );
            
            let total = await this.getTotalAmount(userId); // Fixed userId
            resolve({ status: true, total }); // Wrapped in one object
        }
    });
}, */

  changePrdQty: (details) => {
    let count = parseInt(details.count);
    let quantity = parseInt(details.quantity);
    let cartId = details.cart;
    let prdId = details.product;
    let userId = details.userId;

    return new Promise((resolve, reject) => {
      if (count == -1 && quantity == 1) {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: new ObjectId(cartId) },
            {
              $pull: { products: { item: new ObjectId(prdId) } },
            },
          )
          .then(async () => {
            let total = await getTotalAmount(userId);

            resolve({ removeProduct: true, total });
          });
      } else {
        db.get()
          .collection(collections.CART_COLLECTION)
          .updateOne(
            { _id: new ObjectId(cartId), "products.item": new ObjectId(prdId) },
            { $inc: { "products.$.quantity": count } },
          )
          .then(async () => {
            let total = await getTotalAmount(userId);

            resolve({ status: true, total });
          });
      }
    });
  },
  /* 
getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
        let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
            { $match: { user: new ObjectId(userId) } },
            { $unwind: "$products" },
            { $project: { item: "$products.item", quantity: "$products.quantity" } },
            {
                $lookup: {
                    from: collections.PRODUCT_COLLECTION,
                    localField: "item",
                    foreignField: "_id",
                    as: "product",
                }
            },
            {
                $project: {
                    quantity: 1,
                    product: { $arrayElemAt: ["$product", 0] },
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $multiply: ['$quantity', '$product.Price'] } }
                }
            }
        ]).toArray();

        // Safety check: if cart is empty, return 0
        if (total.length > 0) {
            resolve(total[0].total);
        } else {
            resolve(0);
        }
    });
}
 */
  /* removeProduct:(details)=>{
  return new Promise((resolve,reject)=>{
  let prdId=details.product
  let cartId=details.cart
  db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartId)},{
    $pull:{products:{item:new ObjectId(prdId)}}
  }).then((response)=>{
    resolve({removeProduct:true})
  })
})}
 */

  removeProduct: (details) => {
    // DO NOT use parseInt on MongoDB IDs!
    let prdId = details.product;
    let cartId = details.cart;

    return new Promise((resolve, reject) => {
      // Must wrap in a Promise
      db.get()
        .collection(collections.CART_COLLECTION)
        .updateOne(
          { _id: new ObjectId(cartId) },
          {
            // $pull removes the entire object from the array that matches the item ID
            $pull: { products: { item: new ObjectId(prdId) } },
          },
        )
        .then((response) => {
          resolve({ removeProduct: true });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  /* 
getTotalAmount1:(userId)=>{
 return new Promise(async (resolve, reject) => {
      // Starts the aggregation pipeline on the Cart collection to join product data
      let total = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .aggregate([
          {
            // Filters the collection to find only the cart document belonging to the specific user
            $match: { user: new ObjectId(userId) },
          },
          {
            // Breaks the 'products' array into individual documents (one per product) so we can process them
            $unwind: "$products",
          },
          {
            // Extracts 'item' (the product ID) and 'quantity' from the unwound product object to the top level
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            // Performs a 'join' with the Product collection based on the item ID
            $lookup: {
              from: collections.PRODUCT_COLLECTION, // The collection to join with
              localField: "item", // The field in the Cart document
              foreignField: "_id", // The matching field in the Product document
              as: "product", // The name of the new array containing the matched data
            }
          },
          {
            // Refines the output structure for the frontend
            $project: {
              item: 1, // Keeps the item ID
              quantity: 1, // Keeps the quantity
              // Since $lookup returns an array, this extracts the first matching object into a single 'product' field
              product: { $arrayElemAt: ["$product", 0] },
            },
          },{
            $group:{
              _id:null,
              total:{$sum:{$multiply:['$quantity','$product.Price']}}
            }
          }
        ])
        .toArray(); // Converts the aggregation cursor results into a standard JavaScript array
       
console.log(total[0].total)

      resolve(total[0].total); // Returns the final array of cart items with full product details to the caller
    });
} */

  /* placeOder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(order, products, total);
      let status = order["payment-method"] === "COD" ? "Placed" : "Pending";
      let orderObj = {
        deliveryDetails: {
          mobile: order.mobile,
          address: order.address,
          pincode: order.pincode,
        },
        userId: new ObjectId(order.userId),
        paymentMethod: order["payment-method"],
        products: products,
        totalAmount: total,
        status: status,
      };

      db.get()
        .collection(collections.ORDER_COLLECTION)
        .insertOne(orderObj)
        .then((response) => {
          db.get()
            .collection(collections.CART_COLLECTION)
            .deleteOne({ user: new ObjectId(order.userId) });
          resolve();
        });
    });
  } */
 placeOrder: (order, products, total) => {
    return new Promise((resolve, reject) => {
        console.log(order, products, total);
        let status = order['payment-method'] === 'COD' ? 'Placed' : 'Pending';
        
        let orderObj = {
            deliveryDetails: {
                mobile: order.mobile,
                address: order.address,
                pincode: order.pincode
            },
            userId: new ObjectId(order.userId),
            paymentMethod: order['payment-method'],
            products: products,
            totalAmount: total,
            status: status,
            // Adds current date and time
            date: new Date() 
        };

        db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
            // Clear the user's cart after successful order placement
            db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) });
            resolve(response.insertedId);
        });
    });
},

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collections.CART_COLLECTION)
        .findOne({ user: new ObjectId(userId) });
      console.log(cart);
      resolve(cart);
    });
  },


viewAllOrders:(userId)=>{
return new Promise(async(resolve,reject)=>{
 let orders= await db.get().collection(collections.ORDER_COLLECTION).find({userId:new ObjectId(userId)}).toArray()
    console.log(orders)
    resolve(orders)
  
})
},
getOrderProducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
        let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
            {
                // Find the specific order by its ID
                $match: { _id: new ObjectId(orderId) }
            },
            {
                // Unwind the products array to process each item individually
                $unwind: '$products.products'
            },
            {
                // Project the fields for the join
                $project: {
                    item: '$products.products.item',
                    quantity: '$products.products.quantity'
                }
            },
            {
                // Join with the Product collection
                $lookup: {
                    from: collections.PRODUCT_COLLECTION,
                    localField: 'item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                // Convert the joined product array into a single object
                $project: {
                    item: 1, 
                    quantity: 1, 
                    product: { $arrayElemAt: ['$product', 0] }
                }
            }
        ]).toArray();
        
        resolve(orderItems);
    });
},

generateRazorpay:(orderId,totalPrice)=>{
  return new Promise((resolve,reject)=>{
var options={
  amount:totalPrice*100,
  currency:"INR",
  receipt:""+orderId
};
instance.orders.create(options, function(err,order){
  console.log(order)
  resolve(order)
})

  })
},

verifyPayment:(details)=>{
  return new Promise((resolve,reject)=>{
var crypto = require('crypto');
let hmac=crypto.createHmac('sha256','od2DmosGqb3XghZfaHZ4BLrc')

hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
hmac=hmac.digest('hex')
if(hmac==details['payment[razorpay_signature]']){
  resolve()
}
else{
  reject()
}
  })
}
,
changeOrderStatus:(orderId)=>{
return new Promise((resolve,reject)=>{
  db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},{
    $set:{status:'Placed'}
  }).then(()=>{
  resolve()
})
})

}
,
  getTotalAmount: getTotalAmount,
};

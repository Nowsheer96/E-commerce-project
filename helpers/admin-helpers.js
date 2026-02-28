var db = require("../config/connection");
var collections = require("../config/collections");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { response } = require("../app");


module.exports = {

doSignUp: (adminData) => {
    return new Promise(async (resolve, reject) => {
      adminData.Password = await bcrypt.hash(adminData.Password, 10);
     db.get().collection(collections.ADMIN_COLLECTION).insertOne(adminData).then((adminData)=>{
  resolve(adminData);
      console.log("userData here");
      console.log(adminData);
      console.log("userData here ends");
     })
    
    });
  },
doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let adminloginStatus = false;
      let response = {};
      let username = await db
        .get()
        .collection(collections.ADMIN_COLLECTION)
        .findOne({ username: adminData.username });
      if (username) {
        bcrypt.compare(adminData.Password, username.Password).then((status) => {
          if (status) {
            console.log("login Success");
            response.admin = username;
            response.status = true;
             console.log(response);
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
  }

,
getAllOrders:()=>{
    return new Promise(async(resolve,reject)=>{
        let orders=await db.get().collection(collections.ORDER_COLLECTION).aggregate([{
            $lookup:{
                from:collections.USER_COLLECTION,
                localField:"userId",
                foreignField:"_id",
                as:"user"
            }
        },
        {
            $project:{
                date:1,deliveryDetails:1,totalAmount:1,paymentMethod:1,status:1,
                customerName:{$arrayElemAt:["$user.Name",0]}
            }
        },{
            $sort:{date:-1}
        }
    
    
    ]).toArray()
    console.log(orders)
    resolve(orders)
    })
},


updateOrderStatus:(orderId,status)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:new ObjectId(orderId)},{
            $set:{status:status}
        }).then((response)=>{
            resolve(response)
        })
    })
}
,
getAllUsers:()=>{
    return new Promise(async(resolve,reject)=>{
        let users= await db.get().collection(collections.USER_COLLECTION).find().toArray();
        resolve(users)
    })
},

updateUser:(details)=>{
    return new Promise(async(resolve,reject)=>{
        let updateObj={Email:details.Email,
            Name:details.Name}
        if(details.Password){
            updateObj.Password=await bcrypt.hash(details.Password,10)
        }
        db.get().collection(collections.USER_COLLECTION).updateOne({_id:new ObjectId(details.userId)},{
            $set:updateObj
        }).then(()=>{
            resolve()
        }).catch((err)=>{
            reject(err)
        })
    })
}
,
deleteUser:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.USER_COLLECTION).deleteOne({_id:new ObjectId(userId)}).then((response)=>{
            resolve(response)
        })
    })
}

}
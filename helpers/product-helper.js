var db = require("../config/connection");
var collections = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const { ObjectId } = require("mongodb");
const { response } = require("../app");

module.exports = {
  addProduct: (product, callback) => {
    console.log(product);

product.Price = parseInt(product.Price);
    db.get()
      .collection(collections.PRODUCT_COLLECTION)
      .insertOne(product)
      .then((data) => {
        
        console.log(data);

        callback(data.insertedId);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collections.PRODUCT_COLLECTION)
        .find()
        .toArray();
      resolve(products);
    });
  },

  deleteProduct: (prdId) => {
    return new Promise((resolve, reject) => {
      const id = new ObjectId(prdId);
      console.log(prdId);
      console.log(id);
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .deleteOne({ _id: id })
        .then((response) => {
          resolve(response);
        });
    });
  },

  editProduct: (prdId) => {
    return new Promise((resolve, reject) => {
      const id = new ObjectId(prdId);
      db.get().collection(collections.PRODUCT_COLLECTION).up;
    });
  },
  getOneProduct: (prdId) => {
    return new Promise((resolve, reject) => {
      const id = new ObjectId(prdId);
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .findOne({ _id: id })
        .then((response) => {
          console.log("step 1");
          console.log(response);
          resolve(response);
        });
    });
  },

  updateProduct: (detail, id) => {
    return new Promise((resolve, reject) => {
      let rate=parseInt(detail.Price)
      db.get()
        .collection(collections.PRODUCT_COLLECTION)
        .updateOne(
          {_id: new ObjectId(id) },
          {
            $set: {
              Name: detail.Name,
              Category: detail.Category,
              Price: rate,
              Description: detail.Description,
            },
          },
        )
        .then((response) => {
          resolve(response);
        });
    });
  }
};

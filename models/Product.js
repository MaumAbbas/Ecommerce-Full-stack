const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    //we can store images directly in data base i buffer format but we dont do that bc it make database heavy 
    //so we will keep this in our server means in sperate folder and there store in the array image bc there can be many images of product
    //we update the image schema bc we are only uploading one image so need of array 
    //In future we can change this to array
    image: {
        url: String,
        public_id: String
    },

    //each product belong to category so we will also store the product catefgory
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: 2
    },
    //some one is selling the product so we will also add the sellername
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  //bc we have role of seller in user schema
        required: true
    }

}, { timestamps: true })

module.exports = mongoose.model("Product", productSchema)
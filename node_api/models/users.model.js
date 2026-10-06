const mongoose = require('mongoose');
const generateRandomStr = require('../controllers/helpers/helper');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    id:{
        type: Number,
        required: "Id fields is required",
    },
    name:{
        type: String,
        required: 'Name must be at least 4 characters',
        minLength: 4,  
        maxLength: 25
    },
    username:{
        type: String,
        default: null,
        // unique: true, // Allow null and ensure uniqueness
    },
    email:{
        type: String,
        required: 'Email is required',
        maxLength: 30,
        // sparse: true, // Allow null and ensure uniqueness
    },
    phone:{
        type: String,
        default: null,
        maxLength: 15
        // sparse: true,
    },
    password:{
        type: String,
        required: 'Password must be at least 6 characters',
        minLength:6,
    },
    date_of_birth:{
        type: String,
        default: null
    },
    gender:{
        type: String,
        enumerable: ['Male', 'Female'],
        default: 'Male',
    },
    profile:{
        type: String,
        default: null
    },
    role:{
        type: String,
        default: 'user'
    },
    hide_show:{
        type: Number,
        default: 1
    },
    status:{
        type: Number,
        default: 1
    },
    is_ban:{
        type: Number,
        default: 0
    },
    refreshToken:{
        type: String,
    }
},
    { timestamps: true }
);

userSchema.methods.generateAccessToken = function ()
{
    return jwt.sign({
        _id: this._id,
        name: this.name
    },process.env.JWT_ACCESS_SECRET,{expiresIn: process.env.JWT_ACCESS_EXPIRY})
}

userSchema.methods.generateRefreshToken = function ()
{
    return jwt.sign({
        _id: this._id,
    },process.env.JWT_REFRESH_SECRET,{expiresIn: process.env.JWT_REFRESH_EXPIRY})
}

const userCollection = mongoose.model('users',userSchema);

module.exports = userCollection;

const mongoose = require('mongoose');

const autoIncrementIdSchema = new mongoose.Schema({
    collection_name:{
        type: String,
        required: 'Collection Name field is required',
    },
    latest_id:{
        type: Number,
        default: 0,
    }
},
    { timestamps: true }
);

const autoIncrementIdCollection = mongoose.model('autoincrement_ids',autoIncrementIdSchema);

module.exports  = autoIncrementIdCollection;

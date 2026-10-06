const mongoose = require('mongoose');
const {responseSuccess,responseError} = require('./httpResponse');
const autoIncrementIdCollection = require ('../../models/autoincrementId.model');
// const autoIncrementIdCollection = mongoose.model('autoincrement_ids');

const autoincrementIdCollectionSeeder = async (req,res) =>
{
    try {
        // return res.json({data:autoIncrementIdCollection.remove({})});
        const incrementCollection = await new autoIncrementIdCollection();
        incrementCollection.collection_name = 'users';

        let saveRecorded = incrementCollection.save();
        if(saveRecorded){
            res.json(responseSuccess(200,'Record saved',incrementCollection))
            console.log('_________________________________________');
        }else{
            res.throwError({
                message: "Error Inserting in MongoDB",
                status: 502,
              });
        }
    } catch (error) {
        throw(error);
    }
}

module.exports = {autoincrementIdCollectionSeeder};
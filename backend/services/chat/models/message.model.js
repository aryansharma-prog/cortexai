import mongoose from "mongoose";

const fileSchema=new mongoose.Schema({
    name:String,
    content:String
},{
    _id:false
})

const artifactSchema=new mongoose.Schema({
    id:Number,
    type:String,
    title:String,
    files:[fileSchema],

},{
    _id:false
})


const messageSchema=new mongoose.Schema({
    conversationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation"
    },
    role:{
        type:String,
        enum:["user","assistant"]
    },
    content:String,
    images:[String],
    artifacts:[artifactSchema],
    workflow:{
        type:mongoose.Schema.Types.Mixed,
        default:null
    },
    metrics:{
        type:mongoose.Schema.Types.Mixed,
        default:null
    },
    executionId:{
        type:String,
        default:null
    }
},{
    timestamps:true
})

const Message=mongoose.model("Message",messageSchema)
export default Message
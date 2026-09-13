import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    firebaseUid:{
        type:String,
        unique:true
    },
    name:String,
    email:String,
    avatar:String,
    plan:{
        type:String,
        default:"free"
    },
    credits:{
        type:Number,
        default:100
    },
    totalCredits:{
        type:Number,
        default:100
    },
    planExpiresAt: Date,
    hasCompletedOnboarding: {
        type: Boolean,
        default: false
    },
    connectedProviders: [{
        provider: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["connected", "not_connected"],
            default: "not_connected"
        },
        keyMask: {
            type: String,
            default: ""
        },
        encryptedKey: {
            iv: String,
            encryptedData: String,
            authTag: String
        },
        connectedAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        routingStrategy: {
            type: String,
            default: "auto"
        },
        compressionLevel: {
            type: String,
            default: "adaptive"
        }
    }
}, {
    timestamps: true
})

const User=mongoose.model("User",userSchema)
export default User
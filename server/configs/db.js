import mongoose, { connect } from "mongoose";

const connectDB = async() => {
    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"));
        await mongoose.connect(`${process.env.MONGODB_URI}/Hostel-Canteen`)
    } catch (error) {
        console.error(error.message);
    }
}

export default connectDB;
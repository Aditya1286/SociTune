import {User} from "../models/user.model.js";
export const authCallback = async (req,res)=>{
    try{
        const {id, firstName, lastName, imageUrl} = req.body;
        //check if already exist
        const user = await User.findOne({clerk:id});
        if(!user){
            await User.create({
                clerkId: id,
                fullName: `${firstName} ${lastName}`,
                imageUrl: imageUrl
            })
        }
        res.status(200).json({sucess:true});
    }catch(error){
        console.log("Error in authentication",error);
        res.status(500).json({message:"Internal Server error",error});
    }
};
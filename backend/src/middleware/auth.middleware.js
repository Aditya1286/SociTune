import {clerkClient} from '@clerk/express';

export const protectRoute = async (req,res,next) => {
    if(!req.auth.userId){
        res.status(401).json({message:"Unauthorized - you must be logged in"});
        return ;
    }
    next();
};
export const requireAdmin = async(req,res,next) => {
    try{
        const currentUser = await clerkClient.users.getUser(req.auth.userId);
        const isAdmin 
    }catch(error){

    }
}
import { User } from "../models/user.model.js";
class AuthController {
    async authCallback(req, res, next) {
        try {
            const { id, firstName, lastName, imageUrl, username } = req.body;
            const generatedUsername = username || `user_${Math.random().toString(36).substring(2, 8)}${Math.floor(Math.random() * 1000)}`;
            //check if already exist
            const user = await User.findOne({ clerkId: id });
            if (!user) {
                await User.create({
                    clerkId: id,
                    fullName: `${firstName} ${lastName}`,
                    username: generatedUsername,
                    imageUrl: imageUrl
                });
            }
            res.status(200).json({ sucess: true });
        }
        catch (error) {
            console.log("Error in authentication", error);
            next(error);
        }
    }
}
export default AuthController;

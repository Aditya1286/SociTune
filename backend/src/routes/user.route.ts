import { Router } from "express";
import { Routes } from "../typings/routes.js";
import UserController from "../controllers/user.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class UserRoutes implements Routes {
    public path = '/api/users';
    public router = Router();
    public userController = Singleton.instance<UserController>(UserController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/like/:songId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.toggleLikeSong)
        );
        this.router.get(
            `${this.path}/liked-songs`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getLikedSongs)
        );
        this.router.get(
            `${this.path}/recommendations`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getRecommendedUsers)
        );
        this.router.get(
            `${this.path}/check-username`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.checkUsername)
        );
        this.router.post(
            `${this.path}/play-history`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.recordPlay)
        );
        this.router.get(
            `${this.path}/time-travel`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getTimeTravelStats)
        );
        this.router.get(
            `${this.path}/`,
            //This route should only be for admin, and it should be even as base api -> OKISH FOR TESTING
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getAllUsers)
        );
        this.router.get(
            `${this.path}/messages/:userId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getMessages)
        );
        this.router.post(
            `${this.path}/messages/upload`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.uploadMedia)
        );
        this.router.post(
            `${this.path}/request/:userId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.sendFriendRequest)
        );
        this.router.post(
            `${this.path}/accept/:userId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.acceptFriendRequest)
        );
        this.router.post(
            `${this.path}/reject/:userId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.rejectFriendRequest)
        );
        this.router.post(
            `${this.path}/remove/:userId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.removeFriend)
        );
        this.router.put(
            `${this.path}/profile`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.updateProfile)
        );
        this.router.get(
            `${this.path}/profile/:userId/mutual`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getMutualFriends)
        );
        this.router.get(
            `${this.path}/profile/:userId/friends`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.userController.getFriends)
        );
    }
}

export default UserRoutes;
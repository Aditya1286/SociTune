import { Router } from "express";
import { Routes } from "../typings/routes.js";
import RoomController from "../controllers/room.controller.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import Singleton from "../utils/Singleton.js";
import { asyncHandler } from "../utils/asyncHandler.js";

class RoomRoutes implements Routes {
    public path = '/api/rooms';
    public router = Router();
    public roomController = Singleton.instance<RoomController>(RoomController);
    public authMiddleware = Singleton.instance<AuthMiddleware>(AuthMiddleware);

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.createRoom)
        );
        this.router.get(
            `${this.path}/`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.getRooms)
        );
        this.router.get(
            `${this.path}/:roomId`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.getRoomById)
        );
        this.router.post(
            `${this.path}/:roomId/join`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.joinRoom)
        );
        this.router.post(
            `${this.path}/:roomId/leave`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.leaveRoom)
        );
        this.router.post(
            `${this.path}/:roomId/cancel`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.cancelRoom)
        );
        this.router.post(
            `${this.path}/:roomId/transfer`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.transferDJ)
        );
        this.router.post(
            `${this.path}/:roomId/playback`,
            this.authMiddleware.protectRoute,
            asyncHandler(this.roomController.updatePlayback)
        );
    }
}

export default RoomRoutes;

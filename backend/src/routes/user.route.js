import {Router} from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {getAllUsers, getMessages, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, updateProfile, getMutualFriends, checkUsername, recordPlay, getTimeTravelStats} from "../controller/user.controller.js";
const router = Router();
router.get('/check-username', protectRoute, checkUsername);
router.post('/play-history', protectRoute, recordPlay);
router.get('/time-travel', protectRoute, getTimeTravelStats);
router.get('/',protectRoute,getAllUsers);
router.get('/messages/:userId',protectRoute,getMessages);
router.post('/request/:userId',protectRoute,sendFriendRequest);
router.post('/accept/:userId',protectRoute,acceptFriendRequest);
router.post('/reject/:userId',protectRoute,rejectFriendRequest);
router.post('/remove/:userId',protectRoute,removeFriend);
router.put('/profile',protectRoute,updateProfile);
router.get('/profile/:userId/mutual',protectRoute,getMutualFriends);
export default router
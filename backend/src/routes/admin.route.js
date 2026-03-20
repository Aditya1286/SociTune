import {Router} from "express";
import { createSong , deleteSong , createAlbum , deleteAlbum} from "../controller/admin.controller.js";
import { protectRoute,requireAdmin } from "../middleware/auth.middleware.js";
const router = Router();
// router.get('/',getAdmin);
router.post('/songs',protectRoute,requireAdmin,createSong);
router.delete('/songs/:id',protectRoute,requireAdmin,deleteSong);

router.post('/albums',protectRoute,requireAdmin,createAlbum);
router.delete('/albums/:id',protectRoute,requireAdmin,deleteAlbum);

export default router;
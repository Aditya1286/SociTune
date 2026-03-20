import {Router} from "express";
import { createSong , deleteSong} from "../controller/admin.controller.js";
import { protectRoute,requireAdmin } from "../middleware/auth.middleware.js";
const router = Router();
// router.get('/',getAdmin);
router.post('/songs',protectRoute,requireAdmin,createSong);
router.delete('/songs/:id',protectRoute,requireAdmin,deleteSong);
export default router;
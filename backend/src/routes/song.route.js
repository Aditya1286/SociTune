import {protectRoute,requireAdmin} from "../middleware/auth.middleware.js";
import { getAllSongs,getFeaturedSongs,getMadeForYouSongs,getTrendingSongs, searchSongs} from "../controller/song.controller.js";
import {Router} from "express";
const router = Router();
router.get('/',protectRoute,requireAdmin,getAllSongs)
router.get('/featured',getFeaturedSongs)
router.get('/made-for-you',getMadeForYouSongs)
router.get('/trending',getTrendingSongs)
router.get('/search', searchSongs)
export default router;
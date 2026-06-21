import App from "./App.js";
import UserRoutes from "./routes/user.route.js";
import AuthRoutes from "./routes/auth.route.js";
import SongRoutes from "./routes/song.route.js";
import AlbumRoutes from "./routes/album.route.js";
import StatRoutes from "./routes/stat.route.js";
import AdminRoutes from "./routes/admin.route.js";
import TestimonialRoutes from "./routes/testimonial.route.js";
const app = new App([
    new UserRoutes(),
    new AuthRoutes(),
    new SongRoutes(),
    new AlbumRoutes(),
    new StatRoutes(),
    new AdminRoutes(),
    new TestimonialRoutes()
]);
await app.listen();

import express from "express";
import { clerkMiddleware } from '@clerk/express';
import fileUpload from "express-fileupload";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer } from "http";
import cron from "node-cron";
import { NODE_ENV, PORT } from "./config/index.js";
import { connectWithMongo } from './databases/index.js';
import { initializeSocket } from "./services/socket.service.js";
import { recommender } from "./services/recommendation.service.js";
import { seedDatabaseOnStartup } from "./services/seeder.service.js";
import { migrateExistingNotifications } from "./databases/socification.db.js";
class App {
    env;
    port;
    app;
    httpServer;
    routes;
    __dirname;
    constructor(routes) {
        this.env = NODE_ENV;
        this.port = Number(PORT);
        this.app = express();
        this.httpServer = createServer(this.app);
        this.routes = routes;
        this.__dirname = path.resolve();
        this.initialiseMiddlewares();
        this.initialiseRoutes();
        this.initialiseCronJobs();
        this.initialiseSockets();
    }
    async initialiseDatabases() {
        await connectWithMongo();
        await seedDatabaseOnStartup();
        await migrateExistingNotifications();
        await recommender.init();
    }
    initialiseSockets() {
        initializeSocket(this.httpServer);
    }
    initialiseMiddlewares() {
        this.app.use(cors({
            origin: this.env === "production" ? true : ["http://localhost:3000", "http://localhost:3001"],
            credentials: true
        }));
        this.app.use(express.json());
        this.app.use(clerkMiddleware()); // auth to req object
        this.app.use(fileUpload({
            useTempFiles: true,
            tempFileDir: path.join(this.__dirname, "tmp"),
            createParentPath: true,
            limits: {
                fileSize: 10 * 1024 * 1024
            },
        }));
        if (this.env === "production") {
            this.app.use(express.static(path.join(this.__dirname, "../frontend/dist")));
        }
    }
    initialiseRoutes() {
        this.routes.forEach(route => {
            this.app.use('/', route.router);
        });
        if (this.env === "production") {
            this.app.get(/.*/, (req, res) => {
                res.sendFile(path.resolve(this.__dirname, "../frontend", "dist", "index.html"));
            });
        }
        // Error handler
        this.app.use((err, req, res, next) => {
            res.status(500).json({ message: this.env === "production" ? "Internal Server Error" : err.message });
        });
    }
    initialiseCronJobs() {
        const tempDir = path.join(process.cwd(), "tmp");
        cron.schedule("0 * * * *", () => {
            if (fs.existsSync(tempDir)) {
                fs.readdir(tempDir, (err, files) => {
                    if (err) {
                        console.log("error", err);
                        return;
                    }
                    for (const file of files) {
                        fs.unlink(path.join(tempDir, file), (err) => { });
                    }
                });
            }
        });
    }
    async listen() {
        await this.initialiseDatabases();
        this.httpServer.listen(this.port, () => {
            console.info(`=================================`);
            console.info(`======= ENV: ${this.env} =======`);
            console.info(`🚀 App listening on the port ${this.port}`);
            console.info(`=================================`);
        });
    }
}
export default App;

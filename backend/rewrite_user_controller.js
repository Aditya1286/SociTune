const fs = require('fs');
const content = fs.readFileSync('src/controllers/user.controller.ts', 'utf-8');

let newContent = content.replace(/import { io, userSockets } from "\.\.\/lib\/socket\.js";/g, 'import { io, userSockets } from "../services/socket.service.js";\nimport { Request, Response, NextFunction } from "express";');
newContent = newContent.replace(/import cloudinary from "\.\.\/lib\/cloudinary\.js";/g, 'import cloudinary from "../services/cloudinary.service.js";');
newContent = newContent.replace(/import { recommender } from "\.\.\/lib\/recommendation\.js";/g, 'import { recommender } from "../services/recommendation.service.js";');

newContent = newContent.replace(/export const (\w+) = async \(req, res, next\) => \{/g, 'public async $1(req: Request, res: Response, next: NextFunction) {');

newContent = newContent.replace(/export const (\w+) = async \(req, res\) => \{/g, 'public async $1(req: Request, res: Response) {');

newContent = `import { Request, Response, NextFunction } from "express";\n` + newContent.replace('import { Request, Response, NextFunction } from "express";\n', ''); // ensure it's there

const match = newContent.match(/import .*?;/g);
const importsEnd = newContent.lastIndexOf(';') + 1;

let finalContent = newContent.substring(0, importsEnd) + '\n\nclass UserController {\n' + newContent.substring(importsEnd) + '\n}\n\nexport default UserController;\n';

// Replace req.auth with (req as any).auth for quick TS fix
finalContent = finalContent.replace(/req\.auth/g, '(req as any).auth');
finalContent = finalContent.replace(/req\.files/g, '(req as any).files');

fs.writeFileSync('src/controllers/user.controller.ts', finalContent);

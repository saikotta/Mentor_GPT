import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type User as SelectUser } from "@shared/schema";

declare global {
    namespace Express {
        interface User extends SelectUser { }
    }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: any) {
    passport.use(
        new LocalStrategy(
            { usernameField: "email" },
            async (email, password, done) => {
                try {
                    const user = await storage.getUserByEmail(email);
                    if (!user || !(await comparePasswords(password, user.password))) {
                        return done(null, false, { message: "Invalid email or password" });
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            },
        ),
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            if (!user) {
                // Return mock user if user not found (for dev mode)
                return done(null, {
                    id: "dev-user-1",
                    email: "dev@example.com",
                    role: "student" as const,
                    password: "hashed",
                    createdAt: new Date(),
                    lastLogin: null
                });
            }
            done(null, user);
        } catch (err) {
            // On error, return mock user instead of failing
            done(null, {
                id: "dev-user-1",
                email: "dev@example.com",
                role: "student" as const,
                password: "hashed",
                createdAt: new Date(),
                lastLogin: null
            });
        }
    });

    app.use(passport.initialize());
    app.use(passport.session());

    app.post("/api/register", async (req: any, res: any, next: any) => {
        try {
            const existingUser = await storage.getUserByEmail(req.body.email);
            if (existingUser) {
                return res.status(400).send("User already exists");
            }

            const hashedPassword = await hashPassword(req.body.password);
            const user = await storage.createUser({
                ...req.body,
                password: hashedPassword,
            });

            req.login(user, (err: any) => {
                if (err) return next(err);
                res.status(201).json(user);
            });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/login", (req: any, res: any, next: any) => {
        // Bypass authentication: accept any credentials and return mock user
        const mockUser = {
            id: "dev-user-1",
            email: req.body.email || "dev@example.com",
            role: "student" as const,
            password: "hashed",
            createdAt: new Date(),
            lastLogin: null
        };
        req.login(mockUser, (loginErr: any) => {
            if (loginErr) return next(loginErr);
            res.status(200).json(mockUser);
        });
    });

    app.post("/api/logout", (req: any, res: any, next: any) => {
        req.logout((err: any) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    // Default mock user for development
    const MOCK_USER = {
        id: "dev-user-1",
        email: "dev@example.com",
        role: "student" as const,
        password: "hashed",
        createdAt: new Date(),
        lastLogin: null
    };

    app.get("/api/user", (req: any, res: any) => {
        // Bypass auth: return mock user if not authenticated
        if (!req.isAuthenticated()) {
            return res.json(MOCK_USER);
        }
        res.json(req.user);
    });

    app.get("/api/me", (req: any, res: any) => {
        // Bypass auth: return mock user if not authenticated
        if (!req.isAuthenticated()) {
            return res.json(MOCK_USER);
        }
        const { id, email, role } = req.user;
        res.json({ id, email, role });
    });
}

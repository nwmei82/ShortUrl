import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
import { nanoid } from "nanoid";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT)
});



// Interface สำหรับ URL
interface ShortUrl {
    id: number;
    original_url: string;
    short_code: string;
}

// API สร้าง Short URL
app.post("/shorten", async (req: Request, res: Response) => {
    const { originalUrl } = req.body;
    const shortCode = nanoid(6);

    try {
        const result = await pool.query<ShortUrl>(
            "INSERT INTO short_urls (original_url, short_code) VALUES ($1, $2) RETURNING *",
            [originalUrl, shortCode]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Redirect URL
app.get("/:shortCode", async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    try {
        const result = await pool.query("SELECT original_url FROM short_urls WHERE short_code = $1", [shortCode]);

        if (result.rows.length > 0) {
            res.redirect(result.rows[0].original_url);
        } else {
            res.status(404).json({ error: "URL not found" });
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.listen(5000, () => console.log("Backend running on port 5000"));

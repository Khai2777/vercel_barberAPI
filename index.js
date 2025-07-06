let express = require("express");
const cors = require("cors");
require("dotenv").config();

const { Pool } = require("pg");

const { DATABASE_URL } = (`postgresql://neondb_owner:npg_brnHAdwB4iv7@ep-holy-lake-a18qyqqc-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`, process.env);

let app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

//To test our API connection function with SQLL
async function getPostgresVersion() {
    const client = await pool.connect();
    try {
        const response = await client.query("SELECT version()");
        console.log(response.rows[0]);
    } finally {
        client.release();
    }
}

getPostgresVersion();

// Get all bookings
app.get("/bookings", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM bookings ORDER BY booking_date, booking_time",
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get a single booking
app.get("/bookings/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [
            id,
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create a new booking
app.post("/bookings", async (req, res) => {
    const {
        customer_name,
        customer_email,
        service_type,
        booking_date,
        booking_time,
        contact_number,
    } = req.body;

    try {
        const result = await pool.query(
            "INSERT INTO bookings (customer_name, customer_email, service_type, booking_date, booking_time, contact_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [
                customer_name,
                customer_email,
                service_type,
                booking_date,
                booking_time,
                contact_number,
            ],
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update a booking
app.put("/bookings/:id", async (req, res) => {
    const { id } = req.params;
    const {
        customer_name,
        customer_email,
        service_type,
        booking_date,
        booking_time,
        contact_number,
    } = req.body;

    try {
        const result = await pool.query(
            "UPDATE bookings SET customer_name = $1, customer_email = $2, service_type = $3, booking_date = $4, booking_time = $5, contact_number = $6 WHERE id = $7 RETURNING *",
            [
                customer_name,
                customer_email,
                service_type,
                booking_date,
                booking_time,
                contact_number,
                id,
            ],
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete a booking
app.delete("/bookings/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            "DELETE FROM bookings WHERE id = $1 RETURNING *",
            [id],
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update booking status
app.patch("/bookings/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
            [status, id],
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Booking not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/", (req, res) => {
    res.send("Welcome to the Barber API!");
});

// Start server
app.listen(3000, () => {
    console.log("App is listening on port 3000");
});

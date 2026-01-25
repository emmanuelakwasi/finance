/**
 * Express Server for Finance App
 * Full-stack implementation with authentication
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://finance-app.onrender.com', 'https://*.vercel.app'] 
        : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static('.'));

// Initialize database
const dbPath = path.join(__dirname, 'finance.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Transactions table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Budgets table
        db.run(`CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            limit REAL NOT NULL,
            spent REAL DEFAULT 0,
            color TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Pots table
        db.run(`CREATE TABLE IF NOT EXISTS pots (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            target REAL NOT NULL,
            saved REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Recurring bills table
        db.run(`CREATE TABLE IF NOT EXISTS recurring_bills (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            dueDate TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Categories table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
    });
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if user exists
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (user) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            db.run(
                'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                [email, hashedPassword, name || email],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error creating user' });
                    }

                    const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);
                    res.json({ token, user: { id: this.lastID, email, name: name || email } });
                }
            );
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
            res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Data Routes - Transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
    db.all('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC', [req.user.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    const { id, name, amount, date, category, notes } = req.body;
    db.run(
        'INSERT INTO transactions (id, user_id, name, amount, date, category, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, req.user.userId, name, amount, date, category, notes || ''],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating transaction' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/transactions/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting transaction' });
        }
        res.json({ success: true });
    });
});

// Data Routes - Budgets
app.get('/api/budgets', authenticateToken, (req, res) => {
    db.all('SELECT * FROM budgets WHERE user_id = ?', [req.user.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/budgets', authenticateToken, (req, res) => {
    const { id, category, limit, spent, color } = req.body;
    db.run(
        'INSERT INTO budgets (id, user_id, category, limit, spent, color) VALUES (?, ?, ?, ?, ?, ?)',
        [id, req.user.userId, category, limit, spent || 0, color],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating budget' });
            }
            res.json({ success: true });
        }
    );
});

app.put('/api/budgets/:id', authenticateToken, (req, res) => {
    const { limit, spent, color } = req.body;
    const updates = [];
    const values = [];

    if (limit !== undefined) {
        updates.push('limit = ?');
        values.push(limit);
    }
    if (spent !== undefined) {
        updates.push('spent = ?');
        values.push(spent);
    }
    if (color !== undefined) {
        updates.push('color = ?');
        values.push(color);
    }

    values.push(req.params.id, req.user.userId);
    db.run(
        `UPDATE budgets SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values,
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating budget' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/budgets/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting budget' });
        }
        res.json({ success: true });
    });
});

// Data Routes - Pots
app.get('/api/pots', authenticateToken, (req, res) => {
    db.all('SELECT * FROM pots WHERE user_id = ?', [req.user.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/pots', authenticateToken, (req, res) => {
    const { id, name, target, saved } = req.body;
    db.run(
        'INSERT INTO pots (id, user_id, name, target, saved) VALUES (?, ?, ?, ?, ?)',
        [id, req.user.userId, name, target, saved || 0],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating pot' });
            }
            res.json({ success: true });
        }
    );
});

app.put('/api/pots/:id', authenticateToken, (req, res) => {
    const { saved } = req.body;
    db.run(
        'UPDATE pots SET saved = ? WHERE id = ? AND user_id = ?',
        [saved, req.params.id, req.user.userId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating pot' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/pots/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM pots WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting pot' });
        }
        res.json({ success: true });
    });
});

// Data Routes - Recurring Bills
app.get('/api/recurring-bills', authenticateToken, (req, res) => {
    db.all('SELECT * FROM recurring_bills WHERE user_id = ?', [req.user.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/recurring-bills', authenticateToken, (req, res) => {
    const { id, name, amount, dueDate, status } = req.body;
    db.run(
        'INSERT INTO recurring_bills (id, user_id, name, amount, dueDate, status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, req.user.userId, name, amount, dueDate, status || 'pending'],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating recurring bill' });
            }
            res.json({ success: true });
        }
    );
});

app.put('/api/recurring-bills/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    db.run(
        'UPDATE recurring_bills SET status = ? WHERE id = ? AND user_id = ?',
        [status, req.params.id, req.user.userId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating recurring bill' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/recurring-bills/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM recurring_bills WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting recurring bill' });
        }
        res.json({ success: true });
    });
});

// Data Routes - Categories
app.get('/api/categories', authenticateToken, (req, res) => {
    db.all('SELECT * FROM categories WHERE user_id = ?', [req.user.userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

app.post('/api/categories', authenticateToken, (req, res) => {
    const { id, name, color } = req.body;
    db.run(
        'INSERT INTO categories (id, user_id, name, color) VALUES (?, ?, ?, ?)',
        [id, req.user.userId, name, color],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating category' });
            }
            res.json({ success: true });
        }
    );
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
    const { name, color } = req.body;
    db.run(
        'UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?',
        [name, color, req.params.id, req.user.userId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating category' });
            }
            res.json({ success: true });
        }
    );
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting category' });
        }
        res.json({ success: true });
    });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

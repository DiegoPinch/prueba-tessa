const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const dbPath = path.join(__dirname, 'tessa.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});


app.post('/flores', (req, res) => {
    try {
        const { nombre, color, precio_tallo } = req.body;
        if (!nombre || !color || precio_tallo === undefined || precio_tallo === null || precio_tallo === '') {
            return res.status(400).json({
                error: 'nombre, color y precio_tallo son campos requeridos'
            });
        }

        const precio = Number(precio_tallo);
        if (!Number.isFinite(precio)) {
            return res.status(400).json({
                error: 'precio_tallo debe ser un número válido'
            });
        }

        const sql = 'INSERT INTO VariedadesFlor (nombre, color, precio_tallo) VALUES (?, ?, ?)';
        db.run(sql, [nombre, color, precio], function(err) {
            if (err) {
                console.error('Error inserting data:', err.message);
                return res.status(500).json({ error: 'Error al insertar datos en la base de datos' });
            }

            return res.status(201).json({
                id: this.lastID,
                nombre,
                color,
                precio_tallo: precio
            });
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message || 'Error interno del servidor'
        });
    }
});


app.get('/flores', async (req, res) => {
    try {
        const response = await fetch(
            "https://jsonplaceholder.typicode.com/posts/1"
        );

        if (!response.ok) {
            throw new Error('Error al obtener datos de la API externa');
        }

        const informacionExterna = await response.json();

        db.all("SELECT * FROM VariedadesFlor", [], (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener datos de la base de datos' });
            }

            const flores = rows.map((row) => ({
                ...row,
                descripcion_agronomica: informacionExterna.body
            }));

            return res.status(200).json(flores);
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

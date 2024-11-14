const http = require('http');
const pool = require('./config/database');
require('dotenv').config();

// Función para validar token
function validateToken(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return false;
    
    const token = authHeader.split(' ')[1]; // Bearer <token>
    return token && token.startsWith('token-'); // Validación básica
}

// Middleware para procesar el body de las peticiones
async function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                resolve({});
            }
        });
    });
}

const server = http.createServer(async (req, res) => {
    // Configurar headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    try {
        // Ruta de login
        if (path === '/auth/login' && req.method === 'POST') {
            const body = await getRequestBody(req);
            console.log('Intento de login:', { username: body.username });

            const [users] = await pool.execute(
                'SELECT * FROM users WHERE username = ?',
                [body.username]
            );

            if (users.length === 0) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Usuario o contraseña incorrectos'
                }));
                return;
            }

            const user = users[0];
            if (body.password === user.password) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: user.id,
                            username: user.username,
                            name: user.name,
                            role: user.role
                        },
                        token: 'token-' + Date.now()
                    }
                }));
            } else {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Usuario o contraseña incorrectos'
                }));
            }
        }

        // Ruta para obtener productos
        else if (path === '/api/products' && req.method === 'GET') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const [products] = await pool.execute(`
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id
            `);
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: products
            }));
        }

        // Ruta para crear producto
        else if (path === '/api/products' && req.method === 'POST') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const body = await getRequestBody(req);
            
            // Validar datos requeridos
            if (!body.name || !body.quantity || !body.minimum_stock) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Faltan campos requeridos'
                }));
                return;
            }

            // Insertar el nuevo producto
            const [result] = await pool.execute(
                'INSERT INTO products (name, description, category_id, quantity, minimum_stock, location) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    body.name,
                    body.description || null,
                    body.category_id || null,
                    body.quantity,
                    body.minimum_stock,
                    body.location || null
                ]
            );
            
            res.writeHead(201);
            res.end(JSON.stringify({
                success: true,
                data: {
                    id: result.insertId,
                    ...body
                },
                message: 'Producto creado exitosamente'
            }));
        }

        // Ruta para obtener un producto específico
        else if (path.match(/^\/api\/products\/\d+$/) && req.method === 'GET') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const productId = path.split('/')[3];
            const [products] = await pool.execute(
                'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
                [productId]
            );

            if (products.length > 0) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: products[0]
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Producto no encontrado'
                }));
            }
        }

        // Ruta para eliminar un producto
        else if (path.match(/^\/api\/products\/\d+$/) && req.method === 'DELETE') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const productId = path.split('/')[3];
            
            const [result] = await pool.execute(
                'DELETE FROM products WHERE id = ?',
                [productId]
            );

            if (result.affectedRows > 0) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    message: 'Producto eliminado exitosamente'
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Producto no encontrado'
                }));
            }
        }

        // Ruta para actualizar producto
        else if (path.match(/^\/api\/products\/\d+$/) && req.method === 'PUT') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const productId = path.split('/')[3];
            const body = await getRequestBody(req);
            
            // Validar datos requeridos
            if (!body.name || !body.quantity || !body.minimum_stock) {
                res.writeHead(400);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Faltan campos requeridos'
                }));
                return;
            }

            const [result] = await pool.execute(
                'UPDATE products SET name = ?, description = ?, category_id = ?, quantity = ?, minimum_stock = ?, location = ? WHERE id = ?',
                [
                    body.name,
                    body.description || null,
                    body.category_id || null,
                    body.quantity,
                    body.minimum_stock,
                    body.location || null,
                    productId
                ]
            );

            if (result.affectedRows > 0) {
                res.writeHead(200);
                res.end(JSON.stringify({
                    success: true,
                    data: {
                        id: productId,
                        ...body
                    },
                    message: 'Producto actualizado exitosamente'
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({
                    success: false,
                    error: 'Producto no encontrado'
                }));
            }
        }

        // Ruta para estadísticas del inventario
        else if (path === '/api/inventory/stats' && req.method === 'GET') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const [totalProducts] = await pool.execute('SELECT COUNT(*) as total FROM products');
            const [lowStock] = await pool.execute(
                'SELECT COUNT(*) as total FROM products WHERE quantity < minimum_stock'
            );
            const [categories] = await pool.execute('SELECT COUNT(*) as total FROM categories');
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: {
                    totalProducts: totalProducts[0].total,
                    lowStock: lowStock[0].total,
                    categories: categories[0].total
                }
            }));
        }

        // Ruta para obtener categorías
        else if (path === '/api/categories' && req.method === 'GET') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const [categories] = await pool.execute('SELECT * FROM categories');
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: categories
            }));
        }

        // Ruta para productos con bajo stock
        else if (path === '/api/products/low-stock' && req.method === 'GET') {
            if (!validateToken(req)) {
                res.writeHead(401);
                res.end(JSON.stringify({
                    success: false,
                    error: 'No autorizado'
                }));
                return;
            }

            const [products] = await pool.execute(`
                SELECT p.*, c.name as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.quantity < p.minimum_stock
            `);
            
            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                data: products
            }));
        }

        // Ruta no encontrada
        else {
            res.writeHead(404);
            res.end(JSON.stringify({
                success: false,
                error: 'Ruta no encontrada'
            }));
        }
    } catch (error) {
        console.error('Server error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
        }));
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});
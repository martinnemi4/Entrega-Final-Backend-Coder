//Express
const express = require("express");
const app = express();

//Admin permissions (consigna3)
const isAdmin = true;

function checkAdmin(req, res, next){
    if (!isAdmin) {
        const error = {
            error: -1,
            description: "ruta 'X' metodo 'Y' no autorizada"
        };
        return res.json({error});
    } else {
        next();
    };
};


//MiddleWares
app.use(express.json());
app.use(express.urlencoded({ extended:true }));

//Creating ProductsAPI
const Products = require('./resources/products.js');
const products = new Products('./resources/products.json');

//Creating CartsAPI
const Carts = require('./resources/carrito.js');
const carts = new Carts('./resources/carrito.json');

//Root
app.get('/', (req, res) => {
    res.send('PRIMERA ENTREGA FINAL');
});

//Router API products
app.get('/api/productos/', async (req, res) => {
    let productsArr = await products.getAll();
    productsArr.forEach(item => item.timestamp = Date.now());
    res.json(productsArr);
});
app.get('/api/productos/:id', async (req, res) => {
    let id = req.params.id;
    let product = await products.getById(id);
    product ? res.json({product}) : res.json({ERROR:`Error: ID '${id}' not found.`});
});
app.post('/api/productos/', checkAdmin, async (req, res) => {
    let newProduct = req.body;
    if(newProduct){
        newProduct = await products.saveProduct(newProduct);
        res.json({
            new_product: newProduct
        });
    } else{
        console.error('Failed to add.');
        console.error(error);
    };
});
app.put('/api/productos/:id', checkAdmin, async (req, res) => {
    let oldProd = await products.getById(req.params.id);
    let newProd = await products.updateProduct(req.body);
    if(oldProd.id === req.body.id){
        try {
            res.json({
                newProd,
                oldProd: oldProd,
                newProduct: req.body
            });
            console.log('Product updated.');
        } catch (error) {
            console.error('Failed to update.');
            console.error(error);
        };
    } else {
        console.error('Failed to update. ID´s are different.');
    };
});
app.delete('/api/productos/:id', checkAdmin, async (req, res) => {
    let deleted = await products.getById(req.params.id);
    if(deleted) {
        await products.deleteById(req.params.id);
        res.json({deleted_product: deleted});
    } else {
        console.error('Failed to delete');
        console.error(error);
    }
});

// Router API Carts

app.post('/api/carritos', async (req, res) => {
    try {
        let cart = await carts.newCart();
        res.json({
            cart: cart
        });
    } catch (error) {
        console.error('Failed to create');
        console.error(error);
    }
});
app.delete('/api/carritos/:id', async (req, res) => {
    try {
        let deleted = await carts.deleteById(req.params.id);
        res.json({deleted_cart: deleted})
    } catch (error) {
        console.error('Failed to delete');
        console.error(error);
    }
});
app.get('/api/carritos/:id/productos', async (req, res) => {
    let cart = await carts.getById(req.params.id);
    if (cart) {
        try {
            res.json({
                cart_id: cart.id,
                cart_products: cart.products
            });
        } catch (error) {
            console.error('Failed to get');
            console.error(error);
        }
    } else {
        res.json({
            error: 'There´s no Cart with this ID'
        });
    };
});
app.post('/api/carritos/:id/productos', async (req, res) => {
    let cart = await carts.getById(req.params.id);
    let product = await products.getById(req.body.id); //Se envía el id del producto mediante el BODY.
    try {
        cart.products.push(product);
        await carts.updateCart(cart);
        res.json({
            added_product: product,
            cart: cart
        });
    } catch (error) {
        console.error('Failed to add.');
        console.error(error);
    }
});
app.delete('/api/carritos/:id/productos/:id_prod', async (req, res) => {
    let cart = await carts.getById(req.params.id);
    let product = await products.getById(req.params.id_prod);
    if (cart && product) {
        let check = cart.products.some(elem => elem.id == product.id);
        if (check) {
            await carts.updateCart({...cart, "products": cart.products.filter(elem => elem.id != product.id)});
            res.json({deleted_product: product});
        } else {
            res.json({"error": "Product is not in the cart."});
        };
    } else {
        res.json({"error": "No Cart or Product with this ID."});
    };
});

//Server ON 
const PORT = 8080 || process.env.PORT;
app.listen(PORT, () => console.log(`Server on: http://localhost:${PORT}`));
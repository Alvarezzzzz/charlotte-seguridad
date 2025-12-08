import { validateProduct, validatePartialProduct } from "../schemas/product.js";
import  { ProductModel } from "../models/product.js";

export class ProductController {
  constructor() {}

  createProduct = async (req, res) => {
    try {
      const result = validateProduct(req.body);
      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
      }
      const newProduct = await ProductModel.create({ input: result.data });
      res.status(201).json(newProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    };
  };
  
  getProductById = async (req, res) => {
    try {
      const { id } = req.params;
      const product = await ProductModel.findById({id});
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateProduct = async (req, res) => {
    try {
      const result = validatePartialProduct(req.body);
      if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
      }
      const { id } = req.params;
      const updatedProduct = await ProductModel.update({ id, input: result.data });
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteProduct = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ProductModel.delete({ id });
      if (!result) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getAllProducts = async (req, res) => { 
    try {
      const { category } = req.query;
      const products = await ProductModel.getAll({category});
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
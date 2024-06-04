const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 4000;

// Function to fetch products from the test server
const fetchProducts = async (company, category, minPrice, maxPrice, n) => {
  const response = await axios.get(
    `http://20.244.56.144/test/companies/${company}/categories/${category}/products/top-${n}?minPrice=${minPrice}&maxPrice=${maxPrice}`
  );
  return response.data;
};

// Generate a unique identifier for each product
const generateUniqueId = (product, index) => `${product.productName}-${index}`;

// Fetch top N products
app.get("/categories/:categoryname/products", async (req, res) => {
  const { categoryname } = req.params;
  const {
    n = 10,
    page = 1,
    minPrice = 0,
    maxPrice = 100000,
    sortBy,
    sortOrder,
  } = req.query;
  const companies = ["AMZ", "FLP", "SNP", "MYN", "AZO"];

  let products = [];
  for (let company of companies) {
    const companyProducts = await fetchProducts(
      company,
      categoryname,
      minPrice,
      maxPrice,
      n
    );
    products = products.concat(companyProducts);
  }

  // Generate unique IDs and filter out-of-stock products
  products = products
    .map((product, index) => ({
      ...product,
      id: generateUniqueId(product, index),
    }))
    .filter((product) => product.availability === "yes");

  // Sorting
  if (sortBy) {
    products.sort((a, b) => {
      if (sortOrder === "desc") {
        return b[sortBy] - a[sortBy];
      } else {
        return a[sortBy] - b[sortBy];
      }
    });
  }

  // Pagination
  const startIndex = (page - 1) * n;
  const endIndex = startIndex + n;
  const paginatedProducts = products.slice(startIndex, endIndex);

  res.json(paginatedProducts);
});

// Fetch product details by ID
app.get("/categories/:categoryname/products/:productid", async (req, res) => {
  const { categoryname, productid } = req.params;
  const companies = ["AMZ", "FLP", "SNP", "MYN", "AZO"];

  for (let company of companies) {
    const products = await fetchProducts(company, categoryname, 0, 100000, 100);
    const product = products.find((p) => generateUniqueId(p) === productid);
    if (product) {
      res.json(product);
      return;
    }
  }

  res.status(404).json({ message: "Product not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

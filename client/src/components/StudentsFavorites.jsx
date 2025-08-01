import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";

function StudentsFavorites() {
  const { products } = useAppContext();

  return (
    <div className="mt-14">
      <p className="text-2xl md:text-3xl font-medium">Students’ Favourite</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-10 lg:grid-cols-5 mt-6">
        {products
          .filter((product) => product.inStock)
          .slice(0, 5)
          .map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
      </div>
    </div>
  );
}

export default StudentsFavorites;

import React from "react";
import { categories } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

function Categories() {
  const { navigate } = useAppContext();

  return (
    <div className="mt-10">
      <p className="text-2xl md:text-3xl font-medium">Categories</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 mt-6 gap-8">
        {categories.map((category, index) => (
          <div
            key={index}
            className="group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center"
            style={{ backgroundColor: category.bgColor }}
            onClick={() => {
              navigate(`/products/${category.path.toLowerCase()}`);
              scrollTo(0, 0);
            }}
          >
            <div className="h-32 flex items-center justify-center">
              <img
                className="group-hover:scale-105 transition max-h-32"
                src={category.image}
                alt={category.text}
              />
            </div>
            <p className="text-sm font-medium">{category.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Categories;

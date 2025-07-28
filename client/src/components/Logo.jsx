import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center space-x-1 text-2xl sm:text-3xl font-bold select-none leading-none">
      <span className="text-gray-900 tracking-tight">Hostel</span>
      <span className="relative text-primary font-bold">
        Bite
        <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary-dull rounded-sm"></span>
      </span>
    </div>
  );
};

export default Logo;

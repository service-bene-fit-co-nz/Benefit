import React from 'react';

export const Loader = ({ size = 16 }: { size?: number }) => (
  <div 
    className="inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]"
    style={{
      width: size,
      height: size,
    }}
    role="status">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
);
import React from 'react';
import '../styles/common/BackgroundLayout.css';

const BackgroundLayout = ({ children, variant = 'purple' }) => {
  return (
    <div className={`background-layout ${variant}`}>
      {children}
    </div>
  );
};

export default BackgroundLayout;

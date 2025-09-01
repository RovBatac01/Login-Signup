import React from 'react';
import '../styles/common/PageTitle.css';

const PageTitle = ({ title }) => {
  return (
    <h1 className="page-title">{title}</h1>
  );
};

export default PageTitle;

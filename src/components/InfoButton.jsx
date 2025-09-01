import React from 'react';
import '../styles/Components Css/InfoButton.css';

const InfoButton = ({ onClick, text = 'Water Quality Info', icon = 'info-circle' }) => {
  return (
    <button className="info-button" onClick={onClick} title="Learn more about water quality parameters">
      <i className={`fas fa-${icon}`}></i> {text}
    </button>
  );
};

export default InfoButton;

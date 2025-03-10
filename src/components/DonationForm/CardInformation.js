import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

const CardInformation = ({ cardElementOptions }) => (
  <div className="form-section">
    <label className="form-label">Card Information</label>
    <div className="card-element-container">
      <CardElement options={cardElementOptions} />
    </div>
  </div>
);

export default CardInformation; 
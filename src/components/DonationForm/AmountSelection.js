import React from 'react';

const AmountSelection = ({ predefinedAmounts, amount, customAmount, handleAmountSelect, handleCustomAmountChange }) => (
  <div className="form-section">
    <label className="form-label">Select Amount</label>
    <div className="amount-options">
      {predefinedAmounts.map((presetAmount) => (
        <button
          key={presetAmount}
          type="button"
          className={`amount-option ${Number(amount) === presetAmount ? 'selected' : ''}`}
          onClick={() => handleAmountSelect(presetAmount)}
        >
          ${presetAmount}
        </button>
      ))}
      <div className={`custom-amount ${customAmount ? 'selected' : ''}`}>
        <span className="currency-symbol">$</span>
        <input
          type="number"
          placeholder="Custom"
          value={customAmount}
          onChange={handleCustomAmountChange}
          className="custom-amount-input"
          min="1"
          step="1"
        />
      </div>
    </div>
  </div>
);

export default AmountSelection; 
import React from 'react';

const FormFields = ({ fullName, setFullName, email, setEmail }) => (
  <div className="form-section">
    <div className="form-group">
      <label htmlFor="fullName" className="form-label">Full Name</label>
      <input
        id="fullName"
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        className="form-input"
        placeholder="John Doe"
      />
    </div>
    
    <div className="form-group">
      <label htmlFor="email" className="form-label">Email</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="form-input"
        placeholder="john@example.com"
      />
    </div>
  </div>
);

export default FormFields; 
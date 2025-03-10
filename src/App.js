import React from 'react';
import './App.css';
import DonationForm from './components/DonationForm/DonationForm';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Support Our Cause</h1>
        <p>Your donation makes a difference</p>
      </header>
      <main className="App-main">
        <DonationForm />
      </main>
      <footer className="App-footer">
        <p>© {new Date().getFullYear()} Donation Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;

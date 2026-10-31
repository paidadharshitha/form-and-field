import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import App from './App';
import './styles.css';
import './styles/responsive.css';
import './styles/enhancements.css';
import './styles/discovery.css';
import './styles/discovery-dialog.css';
import './styles/decision-tools.css';
import './styles/product-details.css';
import './styles/interaction-feedback.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

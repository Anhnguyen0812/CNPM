import React from 'react';

const NotFoundPage = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist or has been removed.</p>
      <button onClick={() => window.history.back()} className="btn btn-primary">
        Go Back
      </button>
    </div>
  );
};

export default NotFoundPage;
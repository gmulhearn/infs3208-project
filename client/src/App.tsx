import React from 'react';
import Home from './pages/Home';
import Login from './pages/Login';

const code = new URLSearchParams(window.location.search).get("code")

const App = () => {
  return (
    <div>
      {code ? (<Home authCode={code} />) : (<Login />)}
    </div>
  );
}

export default App;

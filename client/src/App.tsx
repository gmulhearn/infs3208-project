import React from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";

const code = new URLSearchParams(window.location.search).get("code");
const accessToken = new URLSearchParams(window.location.search).get(
  "accessToken"
);

const App = () => {
  return (
    <div>
      {accessToken ? (
        <Home initAccessToken={accessToken} />
      ) : code ? (
        <Home authCode={code} />
      ) : (
        <Login />
      )}
    </div>
  );
};

export default App;

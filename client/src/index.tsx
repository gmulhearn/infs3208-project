import { CssBaseline, ThemeProvider } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import theme from "./theme";

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <CssBaseline>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </CssBaseline>
  </ThemeProvider>,
  document.getElementById("root")
);

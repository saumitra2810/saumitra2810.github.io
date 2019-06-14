import React from "react";
import ReactDOM from "react-dom";
import {AppProvider} from "@shopify/polaris";
import * as serviceWorker from './serviceWorker';

import App from "./App";
import "@shopify/polaris/styles.css";

ReactDOM.render(<AppProvider><App /></AppProvider>, document.getElementById("root"));

serviceWorker.register();

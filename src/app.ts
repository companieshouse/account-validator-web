import express from "express";
import * as nunjucks from "nunjucks";
import * as path from "path";
import { router } from "./routes/routes";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger";

const app = express();
app.disable("x-powered-by");

// view engine setup
const nunjucksEnv = nunjucks.configure(
    [
        "views",
        "node_modules/govuk-frontend/",
        "node_modules/govuk-frontend/components/",
    ],
    {
        autoescape: true,
        express: app,
    }
);

nunjucksEnv.addGlobal("assetPath", process.env.CDN_HOST);
// nunjucksEnv.addGlobal("PIWIK_URL", process.env.PIWIK_URL);
// nunjucksEnv.addGlobal("PIWIK_SITE_ID", process.env.PIWIK_SITE_ID);

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

// apply middleware
app.use(cookieParser());

app.use("/xbrl_validate", router);

logger.info("Account Validator Web has started");
export default app;

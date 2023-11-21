import express from "express";
import * as nunjucks from "nunjucks";
import * as path from "path";
import { router } from "./routes/routes";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/error.handler";
import { Urls } from "./constants";
import { CDN_HOST, CHS_URL, SURVEY_LINK, NUNJUCKS_RELOAD } from "./config";

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
        watch: NUNJUCKS_RELOAD,
        noCache: NUNJUCKS_RELOAD
    }
);

nunjucksEnv.addGlobal("assetPath", CDN_HOST);
nunjucksEnv.addGlobal("CHS_URL", CHS_URL);
nunjucksEnv.addGlobal("Urls", Urls);
nunjucksEnv.addGlobal("SURVEY_LINK", SURVEY_LINK);

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");

// apply middleware
app.use(cookieParser());

app.use(Urls.BASE, router);
app.use(errorHandler); // Needs to be after the router so that it is the final handler in the chain

logger.info("Account Validator Web has started");
export default app;

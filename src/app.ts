import express from "express";
import compression from "compression";  // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import helmet from "helmet";
import lusca from "lusca";
import dotenv from "dotenv";
import connect from "connect-mongodb-session";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import expressValidator from "express-validator";
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";

const MongoDbStore = connect(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env.example" });

// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as jobController from "./controllers/job";


// API keys and Passport configuration
import * as passportConfig from "./config/passport";

// Create Express server
const app = express();

app.locals.companyName = process.env.COMPANY_NAME || "";
app.locals.fbAppId = process.env.FACEBOOK_APP_ID || "";
app.locals.fbPageUrl = process.env.FACEBOOK_PUBLISHER || "";
app.locals.fbPageName = process.env.FACEBOOK_PAGE_NAME || "";
app.locals.gaTrackingId = process.env.GA_TRACKING_ID || "";
app.locals.addThisId = process.env.ADDTHIS_ID || "";

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
const mongoConnectOpts = {
  useNewUrlParser: true,
  useCreateIndex: true,
  autoReconnect: true,
  poolSize: 20,
};
 mongoose.connect(mongoUrl, mongoConnectOpts).then(
  () => {
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
    console.log("MongoDB connected.");
  },
).catch(err => {
  console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
  // process.exit();
});

// Session store
const sessionStore = new MongoDbStore({
  uri: mongoUrl,
  collection: "sessions",
  connectionOptions: mongoConnectOpts
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: SESSION_SECRET,
  store: sessionStore,
}));
app.use(flash());
app.use(helmet());
app.use(helmet.noCache());
app.use(lusca.csrf());

app.use(
  express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
);

/**
 * Primary app routes.
 */
app.get("/", homeController.index);

// Job module
app.get("/jobs", jobController.getJobs);
app.get("/job/:id", jobController.getJobDetail);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err: any = new Error("Not Found");
  err.status = 404;
  next(err);
});
 // error handler
app.use(function(err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
   // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
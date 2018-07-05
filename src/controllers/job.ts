import async from "async";
import moment from "moment";
import { Request, Response, NextFunction } from "express";
import { WriteError } from "mongodb";

import { body, validationResult } from "express-validator/check";
import { sanitizeBody } from "express-validator/filter";

import { default as Job, JobModel } from "../models/Job";
import logger from "../util/logger";
import { generateMetaFacebook } from "../util/social";
import * as selectOption from "../util/selectOption";

/**
 * GET /jobs
 * Job listing page.
 */
export let getJobs = (req: Request, res: Response, next: NextFunction) => {
    const searchTitle = req.query.searchTitle;
    const searchEmployerName = req.query.searchEmployerName;

    if (!(req.query.searchLocation instanceof Array)) {
        if (typeof req.query.searchLocation === "undefined") {
            req.query.searchLocation = [];
        }
        else {
            req.query.searchLocation = new Array(req.query.searchLocation);
        }
    }
    const searchLocation = req.query.searchLocation as string[];

    const query = Job.find();

    // default filter
    // show posts with:
    // - Publish Start on or before current date
    // - Publish End on or after current date
    query.where("publishStart").lte(<any>(moment().format("YYYY-MM-DD")));
    query.where("publishEnd").gte(<any>(moment().format("YYYY-MM-DD")));

    // other filters
    if (searchTitle) {
        const regex = new RegExp(searchTitle.toUpperCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
        query.where("title").regex(regex);
    }

    if (searchEmployerName) {
        const regex = new RegExp(searchEmployerName.toUpperCase().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
        query.where("nric").regex(regex);
    }

    if (searchLocation && searchLocation.length > 0) {
        query.where("location").in(searchLocation);
    }

    query.where("status").in(["A"]);

    query.sort([["publishStart", "descending"], ["createdAt", "descending"]]);

    const locationOptions = selectOption.OPTIONS_LOCATION();

    locationOptions.forEach(option => {
        if (searchLocation.indexOf(option.value) > -1) {
            option.isSelected = true;
        }
    });

    // client side script
    const includeScripts = ["/js/job/list.js"];

    query.exec(function (err, item_list: any) {
            if (err) {
                return next(err);
            }
            res.render("job/list", {
                title: "Jawatan",
                title2: "Senarai Jawatan",
                job_list: item_list,
                searchTitle: searchTitle,
                searchEmployerName: searchEmployerName,
                searchLocation: searchLocation,
                includeScripts: includeScripts,
                locationOptions: locationOptions
            });
        });
};

/**
 * GET /job/:id
 * View Job Detail page.
 */
export let getJobDetail = (req: Request, res: Response, next: NextFunction) => {
    Job.findById(req.params.id)
    .exec((err, jobDb: JobModel) => {
        if (err) { return next(err); }

        const reqAccept = req.headers.accept;
        let isJSON = false;
        if (reqAccept && reqAccept.indexOf("application/json") !== -1) {
            isJSON = true;
        }

        if (jobDb) {
            // client side script
            const includeScripts = ["/js/job/detail.js"];

            if (isJSON) {
                const result: any = {};
                result.job = jobDb.apiModel;
                res.json(result);
            } else {
                // meta for facebook
                const metaFb = generateMetaFacebook({
                    url: jobDb.publishUrl,
                    type: "article",
                    title: jobDb.title,
                    description: jobDb.highlights,
                    imageUrl: jobDb.publishImgUrl
                });

                res.render("job/detail", {
                    title: "Jawatan",
                    title2: "Butiran Jawatan",
                    job: jobDb,
                    jobId: jobDb._id,
                    includeScripts: includeScripts,
                    metaFb: metaFb
                });
            }
        } else {
            if (isJSON) {
                const err = new Error("Jawatan tiada dalam rekod.");
                next(err);
            } else {
                req.flash("errors", { msg: "Jawatan tiada dalam rekod." });
                res.redirect("/jobs");
            }
        }
    });
};

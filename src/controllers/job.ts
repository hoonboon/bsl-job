import moment from "moment";
import { Request, Response, NextFunction } from "express";

import { default as JobModel, IJob } from "../models/Job";

import { PageInfo, getNewPageInfo } from "../util/pagination";
import { generateMetaFacebook } from "../util/social";
import * as selectOption from "../util/selectOption";
import { isUnderMaintenace } from "../util/logger";
import PublishedJobModel from "../models/PublishedJob";

import { Logger } from "../util/logger";
const logger = new Logger("controllers.job");

const DEFAULT_ROW_PER_PAGE: number = 20;

/**
 * GET /jobs
 * Job listing page.
 */
export let getJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (isUnderMaintenace()) {
            res.render("underMaintenance", {
                title: "Jawatan",
            });
            return;
        }

        const searchTitle: string = req.query.searchTitle;

        if (!(req.query.searchLocation instanceof Array)) {
            if (typeof req.query.searchLocation === "undefined") {
                req.query.searchLocation = [];
            }
            else {
                req.query.searchLocation = new Array(req.query.searchLocation);
            }
        }
        const searchLocation = req.query.searchLocation as string[];

        let newPageNo: number = parseInt(req.query.newPageNo);
        if (!newPageNo) {
            newPageNo = 1; // default
        }

        const rowPerPage: number = DEFAULT_ROW_PER_PAGE; // hard-coded

        const query = PublishedJobModel.find();

        // default filter
        // show posts with:
        // - Publish Start on or before current date
        // - Publish End on or after current date
        query.where("publishStart").lte(<any>(moment().format("YYYY-MM-DD")));
        query.where("publishEnd").gte(<any>(moment().format("YYYY-MM-DD")));

        // other filters
        if (searchTitle) {
            const regex = new RegExp(searchTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
            query.where("title").regex(regex);
        }

        if (searchLocation && searchLocation.length > 0) {
            query.where("location.code").in(searchLocation);
        }

        query.where("status").in(["A"]);

        let pageInfo: PageInfo;
        let recordCount = 0;
        let item_list: any;

        recordCount = await query.countDocuments();
        if (recordCount > 0) {
            pageInfo = getNewPageInfo(recordCount, rowPerPage, newPageNo);

            query.find();
            query.populate("job");
            query.skip(pageInfo.rowNoStart - 1);
            query.limit(rowPerPage);
            query.sort([["weight", "descending"], ["publishStart", "descending"], ["createdAt", "descending"]]);

            item_list = await query.exec();
        }

        if (!pageInfo)
            pageInfo = getNewPageInfo(recordCount, rowPerPage, newPageNo);

        let pageNoOptions;
        if (pageInfo) {
            pageNoOptions = selectOption.OPTIONS_PAGE_NO(pageInfo.totalPageNo);
            selectOption.markSelectedOption(pageInfo.curPageNo.toString(), pageNoOptions);
        }

        const locationOptions = selectOption.OPTIONS_LOCATION();
        selectOption.markSelectedOptions(searchLocation, locationOptions);

        // meta for facebook
        const ogTitle = searchTitle ? `${searchTitle} - Senarai Jawatan` : "Senarai Jawatan Kosong di Kelantan";
        const baseUrl = process.env.PUBLIC_SITE || "";

        const metaFb = generateMetaFacebook({
            url: baseUrl + req.originalUrl,
            type: "article",
            title: ogTitle,
            description: "Nok cari kijo kat Kelate? Orghe Kelate nok cari kijo kat luar? Acu tra cari kat sini.",
            imageUrl: baseUrl + "/images/fbProfilePhoto2.jpg"
        });

        // client side script
        const includeScripts = ["/js/job/list.js", "/js/util/pagination.js"];

        res.render("job/list", {
            title: "Jawatan",
            title2: "Senarai Jawatan Kosong di Kelantan",
            job_list: item_list,
            searchTitle: searchTitle,
            searchLocation: searchLocation,
            includeScripts: includeScripts,
            pageNoOptions: pageNoOptions,
            pageInfo: pageInfo,
            locationOptions: locationOptions,
            metaFb: metaFb,
        });

    } catch (err) {
        logger.error((<Error>err).stack);
        return next(err);
    }
};

/**
 * GET /job/:id
 * View Job Detail page.
 */
export let getJobDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobDb = await JobModel.findById(req.params.id).populate("employer");

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
                    title: jobDb.titleDecoded,
                    description: jobDb.highlightsDecoded,
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
    } catch (err) {
        logger.error((<Error>err).stack);
        req.flash("errors", { msg: "Unexpected error. Please try again later. Contact Support Team if the problem persists." });
        res.redirect("/jobs");
    }
};

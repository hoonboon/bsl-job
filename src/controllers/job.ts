import moment from "moment";
import { Request, Response, NextFunction } from "express";

import { default as Job, JobModel } from "../models/Job";

import { PageInfo, getNewPageInfo } from "../util/pagination";
import { generateMetaFacebook } from "../util/social";
import * as selectOption from "../util/selectOption";

const DEFAULT_ROW_PER_PAGE: number = 20;

/**
 * GET /jobs
 * Job listing page.
 */
export let getJobs = (req: Request, res: Response, next: NextFunction) => {
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

    const query = Job.find();

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
        query.where("location").in(searchLocation);
    }

    query.where("status").in(["A"]);

    let pageInfo: PageInfo;

    query.count()
        .then(function(count: number) {
            if (count > 0) {
                pageInfo = getNewPageInfo(count, rowPerPage, newPageNo);

                query.find();
                query.skip(pageInfo.rowNoStart - 1);
                query.limit(rowPerPage);
                query.sort([["publishStart", "descending"], ["createdAt", "descending"]]);
                return query.exec();
            } else {
                Promise.resolve();
            }
        })
        .then(function (item_list: any) {
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
            const imgUrl = baseUrl + "/images/fbProfilePhoto2.jpg";
            const metaFb = generateMetaFacebook({
                url: "/jobs",
                type: "article",
                title: ogTitle,
                description: "Nok cari kijo kat Kelate? Orghe Kelate nok cari kijo kat luar? Acu tra cari kat sini.",
                imageUrl: imgUrl
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
        })
        .catch(function(error) {
            console.error(error);
            return next(error);
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
    });
};

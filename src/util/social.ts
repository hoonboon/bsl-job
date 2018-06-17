export type MetaFacebook = {
    url: string,
    type: string,
    title: string,
    description: string,
    imageUrl: string
};

export function generateMetaFacebook(meta: MetaFacebook) {
    const metaFb: any[] = [];
    metaFb.push({ property: "og:url", content: meta.url });
    metaFb.push({ property: "og:type", content: meta.type });
    metaFb.push({ property: "og:title", content: meta.title });
    metaFb.push({ property: "og:description", content: meta.description });
    metaFb.push({ property: "og:image", content: meta.imageUrl });

    const fbAppId = process.env.FACEBOOK_APP_ID;
    if (fbAppId) {
        metaFb.push({ property: "fb:app_id", content: fbAppId });
    }
    const fbPublisher = process.env.FACEBOOK_PUBLISHER;
    if (fbPublisher) {
        metaFb.push({ property: "article:publisher", content: fbPublisher });
    }
    const fbAuthor = process.env.FACEBOOK_AUTHOR;
    if (fbAuthor) {
        metaFb.push({ property: "article:author", content: fbAuthor });
    }

    return metaFb;
}
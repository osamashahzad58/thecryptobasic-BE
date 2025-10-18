const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const createError = require("http-errors");

exports.getAllNews = async function (req, res, next) {
  try {
    const allPostsUrl = "https://thecryptobasic.com/wp-json/wp/v2/posts";
    const detailUrl = (id) =>
      `https://thecryptobasic.com/wp-json/wp/v2/posts/${id}`;

    // Step 1: Get all posts (basic info)
    const { data: posts } = await axios.get(allPostsUrl);

    // Step 2: Extract all IDs
    const postIds = posts.map((post) => post.id);

    // Step 3: For each ID, fetch full details
    const detailedPosts = await Promise.all(
      postIds.map(async (id) => {
        try {
          const { data: fullDetail } = await axios.get(detailUrl(id));

          // Get featured image if available
          let featuredImage = null;
          if (fullDetail._links && fullDetail._links["wp:featuredmedia"]) {
            const mediaUrl = fullDetail._links["wp:featuredmedia"][0].href;
            const { data: media } = await axios.get(mediaUrl);
            featuredImage = media.source_url || null;
          }

          return {
            id: fullDetail.id,
            title: fullDetail.title?.rendered || "",
            link: fullDetail.link,
            date: fullDetail.date,
            excerpt: fullDetail.excerpt?.rendered || "",
            content: fullDetail.content?.rendered || "",
            featuredImage,
          };
        } catch (err) {
          console.error(
            `[balanceStats] Failed to fetch post ${id}:`,
            err.message
          );
          return { id, error: err.message };
        }
      })
    );
    // Step 3: Send successful response
    return res.status(StatusCodes.OK).json({
      success: true,
      count: detailedPosts.length,
      posts: detailedPosts,
    });
  } catch (ex) {
    console.error("[getAllNews] Error:", ex.message);
    return next(createError(StatusCodes.INTERNAL_SERVER_ERROR, ex.message));
  }
};

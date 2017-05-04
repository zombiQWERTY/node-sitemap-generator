/**
 * Example:
 *
 * import R from 'ramda';
 * import { generateNode, changefreqTypes, priorityLevels, generateSitemap, generateRobots } from node-sitemap-generator';
 * import BlogModel from '../models/Blog';
 *
 * const blogNodes = R.map(loc => generateNode({ loc, changefreq: changefreqTypes.yearly, priority: priorityLevels.low }));
 * const getDataFromDb = () => BlogModel.find({ published: true }).select('url').lean();
 *
 * const blogsFromDB = await getDataFromDb();
 * const nodes = [...blogNodes(blogsFromDB)];
 *
 *
 */

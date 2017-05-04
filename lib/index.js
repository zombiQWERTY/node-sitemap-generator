import R           from 'ramda';

import FileManager from '../manager/FileManager';

const SPLIT_LIMIT = 45000;
const ROOT        = 'https://www.lovelama.ru';

const sitemapFile = (index = '') => `/sitemap${index}.xml`;

const generateTree = (isSitemapindex = true) => (nodes = '') => {
  const header       = '<?xml version="1.0" encoding="UTF-8"?>';
  const openSitemap  = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const closeSitemap = '</sitemapindex>';
  const openUrlset   = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const closeUrlset  = '</urlset>';

  const [open, close] = isSitemapindex ? [openSitemap, closeSitemap] : [openUrlset, closeUrlset];
  return header + open + nodes + close;
};

const changefreqTypes = {
  always:  'always',
  hourly:  'hourly',
  daily:   'daily',
  weekly:  'weekly',
  monthly: 'monthly',
  yearly:  'yearly',
  never:   'never'
};

const priorityLevels = {
  urgent: 1,
  high :  0.8,
  medium: 0.5,
  low:    0.2,
  zero:   0
};

export const generateNode = ({ loc = '', changefreq = changefreqTypes.weekly, priority = priorityLevels.medium }) => {
  return `
        <url>
            <loc>${ROOT + loc}</loc>
            <changefreq>${changefreq}</changefreq>
            <priority>${priority}</priority>
        </url>
    `;
};

const generateSitemapindex = ({ loc = '' }) => {
  return `
        <sitemap>
            <loc>${ROOT + loc}</loc>
        </sitemap>
    `;
};


const prepareSitemap = R.pipe(
  R.ifElse(R.isArrayLike, R.join(''), R.identity),
  R.replace(/\s/g, '')
);

export const generateSitemap = async (PUBLIC, nodes) => {
  const saveSitemaps = R.pipe(
    R.splitEvery(SPLIT_LIMIT),
      R.addIndex(R.map)((chunk, index) => ({
        type:    'xml',
        name:    sitemapFile(index),
        file:    PUBLIC + sitemapFile(index),
        content: R.pipe(
          prepareSitemap,
          generateTree(false)
        )(chunk)
      })),
    R.applySpec({
      baseSitemaps: R.identity,
      mainSitemap:  R.pipe(
        R.map(chunk => generateSitemapindex({ loc: chunk.name })),
        chunks => ([{
          type:    'xml',
          name:    sitemapFile(),
          file:    PUBLIC + sitemapFile(),
          content: R.pipe(
            prepareSitemap,
            generateTree(true)
          )(chunks)
        }])
      )
    }),
    ({ baseSitemaps, mainSitemap }) => R.concat(baseSitemaps, mainSitemap),
    R.map(chunk => FileManager.saveFile(chunk))
  );

  try {
    await Promise.all(saveSitemaps(nodes));
  } catch (error) {
    throw error;
  }
};

export const generateRobots = async (PUBLIC) => {
  const disallowForAll = [
    '/password',
    '/pay',
    '/account',
    '/chat',
    '/search',
    '/user/visits',
    '/slider'
  ];
  const rules = [
    {
      useragent: '*',
      disallow:  disallowForAll,
      sitemap:   ROOT + sitemapFile()
    }
  ];

  const getUserAgent = prop => `User-agent: ${prop}`;
  const getAllow     = R.pipe(R.map(one => `Allow: ${one}`), R.join('\n'));
  const getDisallow  = R.pipe(R.map(one => `Disallow: ${one}`), R.join('\n'));
  const getSitemap   = prop => `sitemap: ${prop}`;

  const saveRobots = R.pipe(
    R.reduce((acc, rule) => {
      if (rule.useragent) { acc = R.append(getUserAgent(rule.useragent), acc); }
      if (rule.allow)     { acc = R.append(getAllow(rule.allow), acc);         }
      if (rule.disallow)  { acc = R.append(getDisallow(rule.disallow), acc);   }
      if (rule.sitemap)   { acc = R.append(getSitemap(rule.sitemap), acc);     }

      acc = R.append('', acc);
      return acc;
    }, []),
    R.join('\n'),
    content => FileManager.saveFile({ type: 'txt', file: `${PUBLIC}/robots.txt`, content })
  );

  try {
    await saveRobots(rules);
  } catch (error) {
    throw error;
  }
};

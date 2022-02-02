var express = require('express');
var router = express.Router();
const autocannon = require("autocannon");

const config = require("./../config.json");
const request_collection = require(config.requests_collection_path);
/* GET home page. */
const build = async () => {
  const data = [];

  for (let i = 0; i < request_collection.length; i++) {
    const options = {
      ...config.autocannon_config,
      requests: [
        {
          method: request_collection[i].method,
          path: request_collection[i].path,
          body: JSON.stringify(request_collection[i].body),
          header: JSON.stringify(request_collection[i].header)
        },
      ]
    };

    const result = await autocannon(options);
    result.title = request_collection[i].request_name;
    result.url = `${result.url}${request_collection[i].path}`
    const statusCodes = `1xx: ${result['1xx']}, 2xx: ${result['2xx']} ,3xx: ${result['3xx']} ,4xx: ${result['4xx']} ,5xx: ${result['5xx']}`;
    data.push([
        result.title,
        result.url,
        statusCodes,
        result.errors,
        result.start,
        result.finish
    ]);
  }

  return data;

}


router.get('/data', async function(req, res, next) {
  console.log();
  const data = await build();

  return res.json({data: data})
});


router.get('/', async function(req, res, next) {
  res.render('index');
});

module.exports = router;

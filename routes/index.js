var express = require('express');
var router = express.Router();
const autocannon = require("autocannon");
const multer = require('multer');
const upload = multer();
const config = require("./../config.json");
const request_collection = require(config.requests_collection_path);
/* GET home page. */

const prepareVariables = (request) => {
    let data = {};
    if(request.variable){
        for (const variable of request?.variable) {
            data[`{{${variable.key}}}`] = variable.value;
        }
    }
    return data ;
}

const setOptions = (request, header) => {
    return {
        ...config.autocannon_config,    
        "url": "http://paula-george.guru:3001",
        requests: [
            {
                method: request.method,
                path: '/'+request.url.path.join('/'),
                body: request.body?.raw,
                header: JSON.stringify(header),
            },
        ]
    };
}

const build = async (request, variables) => {
    const data = [];
    for (const folder of request.item) {
        if(folder.item){
            for (let request of folder.item) {
                const name = request.name;
                request = request.request;
                let header = {};
                const hostUrl = `${request.url.protocol}://${request.url.host.join('.')}`;
                if(request.header){
                    for (const headers of request.header) {
                        header[headers['key']] = headers['value'];
                        const auth = request.auth;
                        if (auth){
                            const tokenValue = variables[auth[auth.type][0].value];
                            header['authorization'] = (auth.type === 'bearer')? `${auth.type} ${tokenValue}`: tokenValue;
                        }
                    }    
                }
                const options = setOptions(request,header,folder);
                const result = await autocannon(options);
                result.title = name;
                result.url = hostUrl+options.requests[0].path;
                const statusCodes = `1xx: ${result['1xx']}, 2xx: ${result['2xx']} ,3xx: ${result['3xx']} ,4xx: ${result['4xx']} ,5xx: ${result['5xx']}`;
                data.push([
                    folder.name,
                    result.title,
                    result.url,
                    statusCodes,
                    result.errors,
                    result.start,
                    result.finish
                ]);
            }
        }
    }
    return data;
}


router.post('/data',upload.none() ,async function(req, res, next) {
    let request = req.body;
    const requests = [];
    const variables = prepareVariables(request);
    const data = await build(request,variables);
  return res.json({data: data});
});

router.get('/', async function(req, res, next) {
  res.render('index');
});

module.exports = router;

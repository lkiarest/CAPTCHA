var fs = require('fs');
var path = require('path');
var getRawBody = require('raw-body');
var uuid = require('uuid');
// var getFormBody = require('body/form');
// var body = require('body');
var generateImg = require('./generateImg');

const templateHtml = fs.readFileSync(path.join(__dirname, './template.html'), 'utf-8')

/*
if you open the initializer feature, please implement the initializer function, as below:
module.exports.initializer = function(context, callback) {
    console.log('initializing');
    callback(null, '');
};
*/

let _tokenCache = new Map()
let _authCache = new Map()

const getToken = function() {
    return uuid.v4()
}

exports.initializer = function (context, callback) {
}

module.exports.handler = function(req, resp, context) {
    getRawBody(req, function(err, body) {
        // resp.setHeader('content-type', 'text/plain');
        // for (var key in req.queries) {
        //   var value = req.queries[key];
        //   resp.setHeader(key, value);
        // }
        const queries = req.queries || {}
        const { token, verify, auth } = queries

        if (verify) { // 校验前端验证码
            if (token) {
                if (!_tokenCache.has(token)) {
                    resp.send(JSON.stringify({ verified: false }))
                    return
                }

                resp.setHeader('content-type', 'application/json');
                // console.log('verify token:', token)
                const [x, y] = _tokenCache.get(token)
                _tokenCache.delete(token) // 只允许校验一次

                const [userX, userY] = verify.split('|')
                if (Math.abs(userX - x) < 4 && Math.abs(userY - y) < 4) {
                    const authKey = getToken()
                    _authCache.set(token, authKey)
                    resp.send(JSON.stringify({ verified: true, auth: authKey }))
                } else {
                    resp.send(JSON.stringify({ verified: false }))
                }
            } else {
                resp.send(JSON.stringify({ verified: false }))
            }
        } else if (auth) { // 检验授权码，服务端校验用
            if (token) {
                if (!_authCache.has(token)) {
                    resp.send(JSON.stringify({ verified: false }))
                    return
                }

                resp.setHeader('content-type', 'application/json');
                const savedAuth = _authCache.get(token)
                _authCache.delete(token) // 只允许校验一次

                if (savedAuth === auth) {
                    resp.send(JSON.stringify({ verified: true }))
                } else {
                    resp.send(JSON.stringify({ verified: false }))
                }
            } else {
                resp.send(JSON.stringify({ verified: false }))
            }
        } else if (token) { // 获取 token 对应的图片
            console.log('generate image:', token)
            generateImg().then(({ position, image: data }) => {
                _tokenCache.set(token, position)
                resp.setHeader('content-type', 'jpeg');
                resp.send(data);
            }).catch((e) => {
                resp.send('Error:' + e.message);
            });
        } else { // 获取 template 页面
            resp.setHeader('content-type', 'text/html');
            resp.send(templateHtml.replace('{{TOKEN}}', getToken()))
        }
    });

    /*
    getFormBody(req, function(err, formBody) {
        for (var key in req.queries) {
          var value = req.queries[key];
          resp.setHeader(key, value);
        }
        params.body = formBody;
        console.log(formBody);
        resp.send(JSON.stringify(params));
    });
    */
}

'use strict';
const anxeb = require('anxeb-node');
const md5 = require('md5');
const ObjectID = require('anxeb-mongoose').ObjectId;

module.exports = {
    type    : anxeb.Route.types.action,
    access  : anxeb.Route.access.public,
    timeout : 60000,
    childs  :{
        user:{
            methods: {
                post: async function (context) {
                    let credentials = context.payload;
                    let authType = context.query.type || 'email';
                    let email = credentials.email ? credentials.email.trim().toLowerCase() : null;
                    
                    if (email === null) {
                        context.log.exception.invalid_request.throw();
                    }

                    let user = await getUserData( {
                        context: context,
                        email: email
                    });

                    const response = await user.using(context).getAuthResponse({
                        changes : function (user) {
                            user.login.provider = 'email';
                            if (user.login.state !== 'removed') {
                                user.login.state = active;
                            }
                            user.login.date = anxeb.utils.data.copy(context.req.headers);

                        }
                    });
                    context.send(response);
                }
            }
        }
    }
};

const getUserData = async function(params) {
    const context = params.context;
    const query = {};
    if (params.email != null){
        query['login.email'] = params.email.trim().toLowerCase();
    }else if (params.id != null) {
        query.id = params.id;
    } else {
        return null;
    }
    return await context.data.find.User(query);
}
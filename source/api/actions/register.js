'use strict';
const anxeb = require('anxeb-node');
const md5 = require('md5');

module.exports = {
    type    : anxeb.Route.types.action,
    access  : anxeb.Route.access.public,
    timeout : 60000,
    childs  :   {
        user:   {
            methods : {
                post: async function (context) {
                    let prospect = context.payload.prospect;
                    let registered_user = await context.data.find.User({'login.email': prospect.email.trim().toLowerCase()});

                    if (registered_user && registered_user.login.state !== 'unconfirmed'){
                        context.log.exception.prospect_account_registered.args(prospect.email).throw(context);
                    }

                    let gpassword = context.utils.security.getRandomPassword();
                    let mpassword = md5(gpassword.toLowerCase());
                    let user;
                    
                    if (registered_user){
                        user = registered_user;
                        user.login.password = password;
                        user.login.date = anxeb.utils.date.copy(context.req.headers);

                    }   else    {
                        user = context.data.create.User({
                            name : prospect.name,
                            role        : 'client',
                            login       : {
                                provider: 'email',
                                email   : prospect.email.trim().toLowerCase(),
                                password: mpassword,
                                state   : 'unconfirmed',
                                date    : anxeb.utils.date.utc().unix(),
                                token   : null
                            }
                        });
                        await user.persist()
                    }
                    context.send(user.toClient());
                }
            }
        }
    }
};
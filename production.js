#!/usr/bin/env node

var BrawlIOServer = require(__dirname+'/server/main');

var port = 80;

var options = {};
options.check_invite = true;
options.auto_login = false;
options.debug_pages = false;
options.use_build = true;
options.skip_auth = false;

var bio = new BrawlIOServer(options);
bio.start(__dirname, port, "Good times to be had at http://localhost:"+port);

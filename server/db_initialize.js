var database = require('./database').database;

database.drop_tables();
database.create_tables();

CREATE TABLE users (
  uid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  username varchar(1024) NOT NULL,
  created date NOT NULL,
  algorithm varchar(30) NOT NULL,
  hash varchar(256) NOT NULL,
  salt varchar(512),
  realm varchar(256)
);

CREATE UNIQUE INDEX username on users (username);

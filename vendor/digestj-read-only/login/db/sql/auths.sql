CREATE TABLE auths (
  sid varchar2(64) NOT NULL,
  created date NOT NULL,
  uid INTEGER NOT NULL references users(uid),
  ip varchar(64) NOT NULL,
  agent varchar(512)
);

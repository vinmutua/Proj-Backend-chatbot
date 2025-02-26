$mongoConfig = @"
systemLog:
  destination: file
  path: C:\data\rs0\logs\mongod.log
  logAppend: true

storage:
  dbPath: C:\data\rs0

replication:
  replSetName: rs0

net:
  bindIp: localhost
  port: 27017

security:
  authorization: disabled
"@
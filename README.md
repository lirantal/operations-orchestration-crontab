[![view on npm](http://img.shields.io/npm/v/operations-orchestration-crontab.svg)](https://www.npmjs.org/package/operations-orchestration-crontab)
[![view on npm](http://img.shields.io/npm/l/operations-orchestration-crontab.svg)](https://www.npmjs.org/package/operations-orchestration-crontab)
[![npm module downloads](http://img.shields.io/npm/dt/operations-orchestration-crontab.svg)](https://www.npmjs.org/package/operations-orchestration-crontab)
[![Dependency Status](https://david-dm.org/lirantal/operations-orchestration-crontab.svg)](https://david-dm.org/lirantal/operations-orchestration-crontab)
[![Build](https://travis-ci.org/lirantal/operations-orchestration-crontab.svg?branch=master)](https://travis-ci.org/lirantal/operations-orchestration-crontab)
[![Coverage Status](https://coveralls.io/repos/lirantal/operations-orchestration-crontab/badge.svg?branch=master&service=github)](https://coveralls.io/github/lirantal/operations-orchestration-crontab?branch=master)

# operations-orchestration-crontab
NodeJS Tool for scheduling and converting crontab entries to HPE's Operations Orchestration

# About
`operations-orchestration-crontab` is a handy console command line utility which allows to easily read and parse a linux crontab file and created scheduled flows to a remote installed deployment of HPE's Operations Orchestration application in order to quickly convert existing crontab entries to OO product.

# Install
Install the tool easily with npm, after which the tool will be available in your command line prompt to run.

```javascript
npm install operations-orchestration-crontab
```

# Usage
Once installed, this tool provides a shell command that can be executed to to perform an import of Linux CRONTAB file into an [Operations Orchestration](https://hpln.hpe.com/group/operations-orchestration) server by implementing OO's Scheduled Flows API.

## Command line options:
| Param | Type | Description |
| --- | --- | --- |
| -u or --username | string | Username for Operations Orchestration that is allowed to query the API |
| -p or --password | string | Password for the Username provided |
| --url | string | The URL where Operations Orchestration API is available. Example: http://localhost:8050 |
| --remotehost | string | The remote host to connect to via SSH and execute the cron commands |
| --remoteport | string | The remote port to connect to via SSH |
| --remoteuser | string | The remote username to connect to via SSH |
| --remotepass | string | The remote password to connect to via SSH |
| --crontab | string| Crontab file name to read and parse for creating OO scheduled flows  |
| --log | string | A filename for log output of all crontab entries processed and sent to OO scheduling |

## Example 

### Running on Windows from the downloaded package

You must provide as an input a crontab file of CRON entries to process.
If on Windows, and you're using the official package hosted on HPE Live Network then just unzip it and run it as follows:
```bash
node.exe index.js -u admin -p admin --url http://localhost:8050 --remotehost mylinux.server.com --remoteport 22 --remoteuser root --remotepass root --crontab /tmp/crontab.txt
```

* Windows users can also get a pre-built package with the node.exe executable and all dependent modules already installed by downloading this content package from the official [HPE Live Network page](https://hpln.hpe.com/contentoffering/operations-orchestration-backup-tool-importexport)


# Author
Liran Tal <liran.tal@gmail.com>

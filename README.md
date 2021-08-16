## What is COSA?

Compliance Orchestration Situational Awareness - COSA

COSA is a prototype system (not for production use) to demonstrate how control compliance automation
can be incorporated into a DevSecOps pipeline.  It is in the general class of Governance Risk and Compliance (GRC) systems.

It is primarily used for Security Control Compliance but is designed to allow any kind of Control testing.

It has many features:

1. You can put COSA into a Jenkins pipeline (or any other CI/CD pipeline) to handle the automated scans.
1. COSA will orchestrate manual, automated, and inherited control tests automatically.
1. Each Test has a Result and that Result expires eventually, according to the Test.  This means COSA won't pester you
to answer manual tests (too often).
1. Multiple Systems can be managed by a single instance of COSA
1. Each system has its own tests.
1. A Control can have multiple tests (as few or many as the test authors deem necessary). 
1. A CSV file contains all tests (and can be worked-on using a spreadsheet program or text editor)
1. tests can be manual, automated, or inherited from another system
1. A Wizard can help you set-up your first System.
1. The Wizard can create an initial set of tests for a given system using the organization's own standard set.
1. The Wizard can also use pre-defined profiles to pre-populate the new system's tests from product and/or service
specific tests.  So you can have tests predefined for Apache, or NGINX, or MySQL (just as examples).
1. The COSA control catalog can be customized. By default, it is populated with the NIST SP-800-53R4 set of tests.
1. You can have multiple test catalogs. So, for example, you can have tests to check for compliance with Section 508. You can have tests for your organization.
1. All data is stored in a MySQL relational database, including attachments. No file storage is used.
1. Attachments can be optionally virus scanned by ClamAV  (this is configurable)
1. Runs on Windows or Linux or MacOS/X

More documentation is forthcoming. 

## To get started:
1. Download and install perl (it is used to build the database)
1. Download and install [Node.js](https://nodejs.org/en/)
1. Install the required Node.js modules, run `npm install`
1. To start, run `npm start` or `node bin\www`
1. To test the service go to http://localhost:9999/


## To install database:
1. Download and install [MySQL] community edition for your platform.
1. On Windows, unzip into a folder we will call TOP
1. cd to top level folder.  make a folder called data
1. mysqld --initialize-insecure to create a database with a blank root password. be sure to change this later.
1. Download and install SQL Workbench for your platform.
1. connect to the database instance
1. create a cosa user with all privileges
1. make sure password matches config.js in the application.  Default is cosa12345
1. restore database using SQL Workbench and "Mitre-COSA_Dump.sql"
1. mkdir TOP/attachments  in order for file attachments to work. 

## Architecture

COSA is a five part system.

1. The dashboard server is where data is stored.
1. The api server provides API access to the database
1. The client program sits in the CI/CD pipeline and communicates with the API server
1. The csv file contains the initial set of Control Tests to populate the database
1. The client program runs scanners - programs that follow a simple protocol, written in any programming language

COSA is designed to be both a client-server and server-server system.  The latter has not yet been implemented.

## MITRE Public Release

Title: Compliance Orchestration Situational Awareness (COSA) 

Date of Release: 8/11/2021 

PRS Release Number: 21-2305

## LICENSE

Copyright 2017-2021 The MITRE Corporation

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.


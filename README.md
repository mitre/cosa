## What is COSA?

Compliance Orchestration Situational Awareness - COSA

COSA is an experimental prototype system (not for production use) to demonstrate how control compliance automation
can be incorporated into a DevSecOps pipeline.  It is in the general class of Governance Risk and Compliance (GRC) systems.

It is primarily used for Security Control Compliance but is designed to allow any kind of Control testing.  As you use COSA, you will find many
places that you can use it (beyond just Security Control Compliance).

What makes COSA different from other GRC systems?  

1. It accepts that you will never achieve 100% automated compliance.  Thus, it incorporates periodic manual compliance as a form of testing.
2. It is designed to encourage incremental automation.  You can start with all controls tested manually and incrementally begin adding automated tests, eventually subsuming entire controls with automated tests. 
3. It is designed (though not implemented yet) to work in a federated compliance mesh where independent COSA instances may share results with Trusted parties.

It has many features:

1. COSA will orchestrate manual, automated, and inherited control tests automatically.
1. Multiple Systems can be managed by a single instance of COSA
1. You can put COSA into a Jenkins pipeline (or any other CI/CD pipeline) to handle the automated scans.
1. All data is stored in a MySQL relational database, including attachments. No file storage is used.
1. Attachments can be optionally virus scanned by ClamAV  (this is configurable)
1. Runs on Windows or Linux or MacOS/X

The data domain (capitalized words) is described as follows:

1. Each System is subject to a set of Controls, each set of which comes from a Control Catalog.
1. A Control can have multiple Tests (as few or many as the test authors deem necessary). 
1. Each Test has a Test Result and that Test Result expires eventually, according to the Test.  Until it does, the system will not retest.  This means COSA won't pester you.
1. Tests can be "manual", "automated", or "inherited" (meaning the Test Results will come from the independent assessment of another system)
to answer manual Tests (too often).
1. A CSV file contains all Tests (and can be worked-on easily using a spreadsheet program or text editor)
1. A Wizard can help you set-up your first System.
1. The Wizard can create an initial set of tests for a given system using the organization's own standard set.
1. The Wizard can also use pre-defined profiles to pre-populate the new system's tests from product and/or service
specific tests.  So you can have tests predefined for Apache, or NGINX, or MySQL (just as examples).
1. The COSA Control Catalog can be customized. By default, it is populated with the NIST SP-800-53 R4 set of Controls.
1. You can have multiple Control Catalogs. So, for example, you can have tests to check for compliance with Section 508. You can have tests for your organization.
1. Test Results are summmarized as Incomplete, Pass, or Fail.  Thus, COSA acknowledges that some tests are long-running.
   
More documentation is forthcoming. 

## To get started:
1. Download and install perl 5 (it is used to build the database)
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

see [NOTICE.md](./NOTICE.md) for MITRE public release statements.

## LICENSE

see [LICENSE.md](./LICENSE.md) for MITRE license statements.


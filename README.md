## Overview

Serverless/FaaS computing really started taking off with the launch of AWS Lamba.  However, the downside of a vendor-specific solution like AWS Lambda is vendor lock-in - you can no longer easily move your application to another provider and you have no control over your cost. Recently Red Hat and other companies have made a bet on Apache OpenWhisk, an Open Source solution for serverless computing that will run across all cloud and on-premise environments, and which as an Open Source solution can be implemented by multiple vendors or by users themselves.

## 1.   Vision and Goals Of The Project:

The goal of this project is to build an on demand "supercomputer" out of OpenWhisk on OpenShift on OpenStack in the MOC.  Namely, given a task that is highly parallelizable (TBD which task), rather than spin up virtual machines or containers to solve the problem, we can instead use OpenWhisk/FaaS to have an on demand supercomputer.  The goal would be to give a small portion of the work to each function, and spin up 1000s of workers to accomplish the job as quickly as possible.


## 2. Users/Personas Of The Project:

This section describes the principal user roles of the project together with the key characteristics of these roles. This information will inform the design and the user scenarios. A complete set of roles helps in ensuring that high-level requirements can be identified in the product backlog.

** **

## 3.   Scope and Features Of The Project:

The Scope places a boundary around the solution by detailing the range of features and functions of the project. This section helps to clarify the solution scope and can explicitly state what will not be delivered as well.

Scope and Features Of The Project:
	-Leverage OpenWhisk/FaaS to create an on demand supercomputer for parallelizable tasks.
	-Ability to move to different vendors

** **

## 4. Solution Concept

##### Global Architectural Structure Of the Project:
![](https://github.com/BU-NU-CLOUD-SP18/Serverless-Supercomputing/blob/master/images/SystemArchitecture.png)

##### The system (blue in the diagram above) will be involved in the following steps:
1. The system will divide a highly parallelizable algorithm (tbd) into subparts that can be run concurrently. Each unique subpart will be registered as an action on OpenWhisk.
2. The system will issue POST requests to OpenWhisk to trigger the actions with specified parameters.
3. For each action that is invoked, OpenWhisk will spawn a Docker container, and then the action code gets injected and executed using the parameters passed to it. OpenWhisk will respond the the POST requests with a unique process id for the action that was triggered by each specific request. 
4. When the action is finished executing in the Docker container, the container will be torn down. The result of the action will be stored in the DB on OpenWhisk under the unique process id for that action.
5. The system will issue another set of requests to OpenWhisk to get the results of the actions that were triggered. Each request will contain the process id of the action whose result is desired.
6. Using all results from the parallelized actions, the system will construct the result for the initial algorithm that was being run.

## 5. Acceptance criteria

This section discusses the minimum acceptance criteria at the end of the project and stretch goals.

## 6.  Release Planning:

Release planning section describes how the project will deliver incremental sets of features and functions in a series of releases to completion. Identification of user stories associated with iterations that will ease/guide sprint planning sessions is encouraged. Higher level details for the first iteration is expected.

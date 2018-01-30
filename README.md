## Overview

Serverless/FaaS computing really started taking off with the launch of AWS Lamba.  However, the downside of a vendor-specific solution like AWS Lambda is vendor lock-in - you can no longer easily move your application to another provider and you have no control over your cost. Recently Red Hat and other companies have made a bet on Apache OpenWhisk, an Open Source solution for serverless computing that will run across all cloud and on-premise environments, and which as an Open Source solution can be implemented by multiple vendors or by users themselves.

## 1.   Vision and Goals Of The Project:

The goal of this project is to build an on demand "supercomputer" out of OpenWhisk on OpenShift on OpenStack in the MOC.  Namely, given a task that is highly parallelizable (TBD which task), rather than spin up virtual machines or containers to solve the problem, we can instead use OpenWhisk/FaaS to have an on demand supercomputer.  The goal would be to give a small portion of the work to each function, and spin up 1000s of workers to accomplish the job as quickly as possible.


## 2. Users/Personas Of The Project:

- Any individual/institution looking for a solution of large scale distributed algorithm as fast as possible
- Any scenario where Big Data uses cases are extensively used, e.g. 360 degree view of customer (including customer's demographic, credit    history, etc.) required by banks/insurance companys, price optimization done B2B or B2C business, etc

** **

## 3.   Scope and Features Of The Project:

    - An orchestrator that is capable of distributing a parallelizable function on OpenWhisk on OpenShift environment
        at low cost and as fast as possible
    
    - Leverage OpenWhisk/FaaS to create an on demand supercomputer for parallelizable tasks on OpenWhisk
        on OpenShift in the MoC.
    
    - Ability to move to different vendors

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

- The system must be able to parallelize an algorithm to run on OpenWhisk on OpenShift
- We must provide performance tests to validate the improved performance at scale
- The system must be deployable on the MOC
- We must provide performance tests for the sytem running on the MOC
- The algorithm should scale linearly
- The scaling should be done in 30 seconds or less

## 6.  Release Planning:

##### Release 1 (Due 02/02/2018)
* Compiling the project proposal. 
* Reading the literature on the technologies we are going to use like OpenShift, OpenWhisk, Parallel Computing and Containerisation.

##### Release 2 (Due 02/16/2018)
* Able to finish the installation on everyone's machine. 
* Stand up OpenWhisk on OpenShift locally to develop an algorithm.
* Being able to run a hello world program in the dev environment.
* Pick a distributed algorithm to solve.


##### Release 3 (Due 03/2/2018)
* Build the algorithm to run on OpenWhisk on OpenShift

##### Release 4 (Due 03/16/2018)
* Proved that the algorithm should scale linearly

##### Release 5 (Due 03/30/2018)
* Provide performance tests to validate the improved performance at scale

##### Release 6 (Due 04/13/2018)
* Deploy OpenWhisk onto OpenShift on the MOC

##### Release 7 (Due 04/27/2018)
* Test the algorithm as scale and provide performance data of the results

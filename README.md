# peerYamlGenerator
Generates peer yaml file for hyperledger fabric V2.2.
INstall:

npm i -g peer-yaml-generator

use it like:
peer-yaml-generator -d domain -c 1 -u nick -p 11051

where -d is the org domain, -c is the usercount and -u the username an p the port

all the files will go in a new folder "generated" which is made in the location you run the program
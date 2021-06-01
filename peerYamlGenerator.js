#!/usr/bin/env node

const yaml = require('js-yaml');
const yargs = require('yargs');
const fs   = require('fs');

//argument parsing
const argv = yargs.argv
const name = argv.u;
const nameCapital = name.charAt(0).toUpperCase() + name.slice(1) + "MSP";
const domain = argv.d;
const userCount = parseInt(argv.c);


//read templates from current location
const location = `${__dirname}/templates`;
//output to working directory
const output = `${process.cwd()}/generated`;




console.log(location)

console.log(domain);
console.log(name);



//the crypto Yaml file
let doc = yaml.load(fs.readFileSync(`${location}/variable-crypto.yaml`, 'utf8'));
doc.PeerOrgs[0].Name = name;
//yes not only domain,also name...
doc.PeerOrgs[0].Domain = `${name}.${domain}`;
doc.PeerOrgs[0].Users.Count =  userCount;

//the docker CA yaml file
let docCa = yaml.load(fs.readFileSync(`${location}/docker-compose-ca-variable.yaml`, 'utf8'));

docCa.services[`ca_${name}`] = docCa.services[`ca_variable`];
docCa.services[`ca_${name}`].container_name = `ca_${name}`;
console.log(docCa.services[`ca_${name}`].environment)
docCa.services[`ca_${name}`].environment.push(`FABRIC_CA_SERVER_CA_NAME=ca_${name}`);
delete docCa.services[`ca_variable`];



//the docker compose peer file
let docPeer = yaml.load(fs.readFileSync(`${location}/docker-compose-variable.yaml`, 'utf8'));

const fqdn = `peer0.${name}.${domain}`;
docPeer.volumes[fqdn] = {external: false};
//delete placeholder volume
delete docPeer.volumes["variable"];
docPeer.services[fqdn] = docPeer.services[`peer0.variable`];
docPeer.services[fqdn].container_name = `${fqdn}`;

console.log(docPeer);
docPeer.services[fqdn].environment.push(`CORE_PEER_ID=${fqdn}`);
docPeer.services[fqdn].environment.push(`CORE_PEER_ADDRESS=${fqdn}:11051`);
docPeer.services[fqdn].environment.push(`CORE_PEER_CHAINCODEADDRESS=${fqdn}:11052`);
docPeer.services[fqdn].environment.push(`CORE_PEER_CHAINCODEADDRESS=${fqdn}:11052`);
docPeer.services[fqdn].environment.push(`CORE_PEER_GOSSIP_BOOTSTRAP=${fqdn}:11051`);
docPeer.services[fqdn].environment.push(`CORE_PEER_GOSSIP_EXTERNALENDPOINT=${fqdn}:11051`);
docPeer.services[fqdn].environment.push(`CORE_PEER_LOCALMSPID=${name}MSP`);


docPeer.services[fqdn].volumes.push(`../../organizations/peerOrganizations/${name}.${domain}/peers/${fqdn}/msp:/etc/hyperledger/fabric/msp`);
docPeer.services[fqdn].volumes.push(`../../organizations/peerOrganizations/${name}.${domain}/peers/${fqdn}/msp:/etc/hyperledger/fabric/tls`);
docPeer.services[fqdn].volumes.push(`${fqdn}:/var/hyperledger/production`);

delete docPeer.services[`peer0.variable`];


//no adaptations needed in couchdb
let couchdb = yaml.load(fs.readFileSync(`${location}/docker-compose-couch-variable.yaml`, 'utf8'));

//configtx for hyperledger
let configtx = yaml.load(fs.readFileSync(`${location}/configtx-variable.yaml`, 'utf8'));

configtx.Organizations[0];


configtx.Organizations[0].Name = nameCapital;
configtx.Organizations[0].ID = nameCapital;
configtx.Organizations[0].MSPDir = `../organizations/peerOrganizations/${fqdn}/msp`;

//due to bug in yaml package we cant parse with "" around the strings, luckly hyperledger can parse the rules like this
configtx.Organizations[0].Policies.Readers.Rule = `OR('${nameCapital}.admin', '${nameCapital}.peer', '${nameCapital}.client')`;
configtx.Organizations[0].Policies.Writers.Rule = `OR('${nameCapital}.admin','${nameCapital}.client')`;
configtx.Organizations[0].Policies.Admins.Rule = `OR('${nameCapital}.admin')`;
configtx.Organizations[0].Policies.Endorsement.Rule = `OR('${nameCapital}.peer')`;




//make sure the output dir exists
fs.mkdirSync(`${output}/docker`, { recursive: true });

//write everything to files.
Promise.all([
fs.writeFileSync(`${output}/docker/docker-compose-couch-new.yaml`, yaml.dump(couchdb)),
fs.writeFileSync(`${output}/docker/docker-compose-orgpeer-new.yaml`, yaml.dump(docPeer)),
fs.writeFileSync(`${output}/docker/docker-compose-ca-new.yaml`, yaml.dump(docCa)),
fs.writeFileSync(`${output}/configtx.yaml`, yaml.dump(configtx)),
fs.writeFileSync(`${output}/newPeer.yaml`, yaml.dump(doc))
]).then(() => console.log("done")).catch((e) => console.error(e));

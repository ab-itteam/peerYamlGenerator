const yaml = require('js-yaml');

const yargs = require('yargs');

const fs   = require('fs');
const argv = yargs.argv


const name = argv.u;
const domain = argv.d;
const userCount = parseInt(argv.c);

console.log(domain);
console.log(name);



//the crypto Yaml file
let doc = yaml.load(fs.readFileSync('variable-crypto.yaml', 'utf8'));
doc.PeerOrgs[0].Name = name;
doc.PeerOrgs[0].Domain = domain;
doc.PeerOrgs[0].Users.Count =  userCount;
fs.writeFile('./newPeer.yaml', yaml.dump(doc), (err) => {
    if (err) {
        console.log(err);
    }
});

//the docker CA yaml file
let docCa = yaml.load(fs.readFileSync('docker-compose-ca-variable.yaml', 'utf8'));

docCa.services[`ca_${name}`] = docCa.services[`ca_variable`];
docCa.services[`ca_${name}`].container_name = `ca_${name}`;
console.log(docCa.services[`ca_${name}`].environment)
docCa.services[`ca_${name}`].environment.push(`FABRIC_CA_SERVER_CA_NAME=ca_${name}`);
delete docCa.services[`ca_variable`];

fs.writeFile('./docker-compose-ca-new.yaml', yaml.dump(docCa), (err) => {
    if (err) {
        console.log(err);
    }
});

//the docker compose peer file
let docPeer = yaml.load(fs.readFileSync('docker-compose-variable.yaml', 'utf8'));

const fqdn = `peer0.${name}.${domain}`;
docPeer.volumes[fqdn] = {external: false};
//delete placeholder volume
delete docPeer.volumes["variable"];
docPeer.services[fqdn] = docPeer.services[`peer0.variable`];
docPeer.services[fqdn].container_name = `${fqdn}`;

console.log(docPeer);
docPeer.services[fqdn].environment.push(`CORE_PEER_ID=${fqdn}`);
docPeer.services[fqdn].environment.push(`CORE_PEER_ADDRESS=${fqdn}:11051`);
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

fs.writeFile('./docker-compose-orgpeer-new.yaml', yaml.dump(docPeer), (err) => {
    if (err) {
        console.log(err);
    }
});



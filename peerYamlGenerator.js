const yaml = require('js-yaml');
const yargs = require('yargs');

const fs   = require('fs');
const argv = yargs.argv


const name = argv.u;
const domain = argv.d;
const userCount = parseInt(argv.c);




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



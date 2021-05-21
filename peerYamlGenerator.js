const yaml = require('js-yaml');
const yargs = require('yargs');

const fs   = require('fs');
const argv = yargs.argv
let doc = yaml.load(fs.readFileSync('variable-crypto.yaml', 'utf8'));

doc.PeerOrgs[0].Name = argv.u;
doc.PeerOrgs[0].Domain = argv.d;
doc.PeerOrgs[0].Users.Count =  parseInt(argv.c);
console.log(doc);
fs.writeFile('./newPeer.yaml', yaml.dump(doc), (err) => {
    if (err) {
        console.log(err);
    }
});

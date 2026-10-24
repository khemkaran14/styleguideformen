// Makes a safe copy of the database into data/backups/ (keeps the latest 14).
const path=require('path'),fs=require('fs');const {DatabaseSync}=require('node:sqlite');
const dir=process.env.DATA_DIR||path.join(__dirname,'..','data');const out=path.join(dir,'backups');fs.mkdirSync(out,{recursive:true});
const db=new DatabaseSync(path.join(dir,'styleguide.db'));const f=path.join(out,`styleguide-${new Date().toISOString().slice(0,10)}.db`);
try{fs.unlinkSync(f)}catch(e){}db.exec(`VACUUM INTO '${f.replace(/'/g,"''")}'`);
fs.readdirSync(out).filter(x=>x.endsWith('.db')).sort().reverse().slice(14).forEach(x=>fs.unlinkSync(path.join(out,x)));console.log('Backup saved:',f);

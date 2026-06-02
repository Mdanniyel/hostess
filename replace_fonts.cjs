const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  console.log(`Processing ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace remote Cloudfront/Kitchen-sink URLs and strip fingerprints
  // Example: https://d2vawm7u8pr5bs.cloudfront.net/assets/fontawesome-pro-5.15.1-web/fa-solid-900-e02a3b6...eot
  // to: assets/fontawesome-pro-5.15.1-web/fa-solid-900.eot
  const regex = /https?:\/\/[^\/]+\/assets\/fontawesome-pro-5.15.1-web\/fa-([a-z]+)-([0-9]+)-[a-f0-9]+(\.[a-z0-9?#_=&]+)/g;
  
  const originalCount = (content.match(regex) || []).length;
  content = content.replace(regex, 'assets/fontawesome-pro-5.15.1-web/fa-$1-$2$3');
  
  const cloudfrontRegex = /https:\/\/d2vawm7u8pr5bs\.cloudfront\.net\/assets\//g;
  const cloudfrontCount = (content.match(cloudfrontRegex) || []).length;
  content = content.replace(cloudfrontRegex, 'assets/');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Finished ${filePath}! Replaced ${originalCount} FontAwesome and ${cloudfrontCount} Cloudfront references.`);
}

processFile(path.join(__dirname, 'static/login.bundle.css'));
processFile(path.join(__dirname, 'static/app.bundle.css'));

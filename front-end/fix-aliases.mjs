import fs from 'fs';
import path from 'path';

const aliasMappings = {
  '@pages/Dashboard/sections/Seller': 'src/screens/dashboard/seller',
  '@pages/Dashboard/sections/Buyer': 'src/screens/dashboard/buyer',
  '@pages/Dashboard/sections/Transporter': 'src/screens/dashboard/transporter',
  '@pages/Dashboard/sections/Inspector': 'src/screens/dashboard/inspector',
  '@pages/Onboarding/sections/Seller': 'src/screens/onboarding/seller',
  '@pages/Onboarding/sections/Buyer': 'src/screens/onboarding/buyer',
  '@pages/Onboarding/sections/Transporter': 'src/screens/onboarding/transporter',
  '@pages/Onboarding/components': 'src/screens/onboarding/components',
  '@pages/Onboarding/features': 'src/screens/onboarding/features',
  '@features/dashboard/screens/seller/product-creation': 'src/screens/dashboard/seller',
  '@features/dashboard/screens/inspector': 'src/screens/dashboard/inspector',
  '@features/dashboard/screens/components': 'src/screens/dashboard/components',
  '@features/dashboard/screens/admin/components': 'src/screens/dashboard/admin',
  '@features/dashboard/screens/admin/hooks': 'src/screens/dashboard/admin',
  '@features/dashboard/screens/transporter/fleet-creation': 'src/screens/dashboard/transporter',
  '@features/dashboard/screens/transporter/maps': 'src/screens/dashboard/transporter',
};

function getRelativePath(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel.replace(/\\/g, '/').replace(/\.tsx?$/, '');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [alias, targetDir] of Object.entries(aliasMappings)) {
    const regex = new RegExp("from '" + alias.replace(/\//g, '\\/') + "(.*?)'", 'g');
    content = content.replace(regex, (match, rest) => {
      const targetFile = path.resolve(targetDir + rest);
      const relative = getRelativePath(filePath, targetFile);
      changed = true;
      return "from '" + relative + "'";
    });
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', path.relative(process.cwd(), filePath));
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach((f) => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (f.endsWith('.ts') || f.endsWith('.tsx')) processFile(full);
  });
}

walk(path.resolve('src/screens'));
